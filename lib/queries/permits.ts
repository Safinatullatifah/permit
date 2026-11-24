import prisma from "@/lib/prisma"
import { PermitStatus, Prisma } from "@prisma/client"

export type PermitTabKey = "open" | "pending" | "rejected" | "archived"
export type PermitSortField =
  | "nomor"
  | "workName"
  | "location"
  | "startDate"
  | "createdAt"
  | "vendor"
export type SortOrder = "asc" | "desc"

export const TAB_TO_STATUS: Record<PermitTabKey, PermitStatus> = {
  open: "OPEN",
  pending: "PENDING",
  rejected: "REJECTED",
  archived: "CLOSED",
}

export interface PermitQueryParams {
  tab?: string
  q?: string
  page?: string | number
  pageSize?: string | number
  sortBy?: string
  sortOrder?: string
  userId?: string
  role?: string
}

export function normalizePermitTab(tab?: string): PermitTabKey {
  const lower = tab?.toLowerCase()
  if (lower === "open" || lower === "pending" || lower === "rejected" || lower === "archived") {
    return lower
  }
  return "pending"
}

export function normalizeSortField(sortBy?: string): PermitSortField {
  if (
    sortBy === "nomor" ||
    sortBy === "workName" ||
    sortBy === "location" ||
    sortBy === "startDate" ||
    sortBy === "createdAt" ||
    sortBy === "vendor"
  ) {
    return sortBy
  }
  return "createdAt"
}

export function normalizeSortOrder(sortOrder?: string): SortOrder {
  return sortOrder === "asc" ? "asc" : "desc"
}

function buildOrderBy(
  sortBy: PermitSortField,
  sortOrder: SortOrder
): Prisma.PermitOrderByWithRelationInput {
  if (sortBy === "vendor") {
    return { vendor: { name: sortOrder } }
  }
  return { [sortBy]: sortOrder }
}

export async function getPaginatedPermits(params: PermitQueryParams) {
  const activeTab = normalizePermitTab(params.tab)
  const activeStatus = TAB_TO_STATUS[activeTab]
  const query = (params.q ?? "").trim()
  const sortBy = normalizeSortField(params.sortBy)
  const sortOrder = normalizeSortOrder(params.sortOrder)

  const parsedPage = Number(params.page)
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1

  const parsedSize = Number(params.pageSize)
  const pageSize =
    parsedSize === 5 || parsedSize === 10 || parsedSize === 20 || parsedSize === 50
      ? parsedSize
      : 10

  const baseConditions: Prisma.PermitWhereInput[] = []

  if (params.role === "USER" && params.userId) {
    baseConditions.push({ userId: params.userId })
  } else if (params.role === "PIC" && params.userId) {
    baseConditions.push({ picId: params.userId })
  } else if (params.role === "LP") {
    // LP hanya memverifikasi izin kerja yang memiliki Nomor PO
    baseConditions.push({
      AND: [{ poNumber: { not: null } }, { poNumber: { not: "" } }],
    })
  }

  if (query) {
    baseConditions.push({
      OR: [
        { nomor: { contains: query, mode: "insensitive" } },
        { workName: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { poNumber: { contains: query, mode: "insensitive" } },
        { spkNumber: { contains: query, mode: "insensitive" } },
        { vendor: { name: { contains: query, mode: "insensitive" } } },
      ],
    })
  }

  const baseWhere: Prisma.PermitWhereInput =
    baseConditions.length > 0 ? { AND: baseConditions } : {}

  const listWhere: Prisma.PermitWhereInput = {
    AND: [...baseConditions, { status: activeStatus }],
  }

  const [total, groupedCounts] = await Promise.all([
    prisma.permit.count({ where: listWhere }),
    prisma.permit.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)

  const items = await prisma.permit.findMany({
    where: listWhere,
    include: {
      vendor: { select: { id: true, name: true } },
      pic: { select: { id: true, full_name: true } },
      user: { select: { id: true, full_name: true } },
    },
    orderBy: buildOrderBy(sortBy, sortOrder),
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  })

  const counts: Record<PermitTabKey, number> = {
    open: 0,
    pending: 0,
    rejected: 0,
    archived: 0,
  }

  for (const row of groupedCounts) {
    if (row.status === "OPEN") counts.open = row._count._all
    if (row.status === "PENDING") counts.pending = row._count._all
    if (row.status === "REJECTED") counts.rejected = row._count._all
    if (row.status === "CLOSED") counts.archived = row._count._all
  }

  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    activeTab,
    sortBy,
    sortOrder,
    query,
    counts,
  }
}

export function serializePermitRows(
  items: Awaited<ReturnType<typeof getPaginatedPermits>>["items"]
) {
  return items.map((item) => ({
    id: item.id,
    nomor: item.nomor,
    workName: item.workName,
    location: item.location,
    startDate: item.startDate.toISOString(),
    endDate: item.endDate.toISOString(),
    poNumber: item.poNumber,
    spkNumber: item.spkNumber,
    isHighRisk: item.isHighRisk,
    picVerified: item.picVerified,
    picVerifiedAt: item.picVerifiedAt ? item.picVerifiedAt.toISOString() : null,
    lpVerified: item.lpVerified,
    userVerified: item.userVerified,
    sheVerifiedAt: item.sheVerifiedAt ? item.sheVerifiedAt.toISOString() : null,
    status: item.status,
    remarkPic: item.remarkPic,
    remarkLp: item.remarkLp,
    remarkUser: item.remarkUser,
    remarkShe: item.remarkShe,
    vendor: item.vendor,
    pic: item.pic,
    user: item.user,
  }))
}
