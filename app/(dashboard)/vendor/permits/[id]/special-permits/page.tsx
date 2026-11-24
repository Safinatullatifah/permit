import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import SpecialPermitsForm from "@/components/special-permits/SpecialPermitsForm"

interface VendorSpecialPermitsPageProps {
  params: Promise<{ id: string }>
}

export default async function VendorSpecialPermitsPage({
  params,
}: VendorSpecialPermitsPageProps) {
  const session = await auth()
  const { id } = await params

  if (!session?.user?.id) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Silakan login terlebih dahulu untuk mengakses halaman ini.
      </div>
    )
  }

  if (id === "[id]") {
    const fallbackPermit = await prisma.permit.findFirst({
      where:
        session.user.role === "VENDOR" && session.user.vendorId
          ? { vendorId: session.user.vendorId }
          : {},
      orderBy: { createdAt: "desc" },
    })
    if (fallbackPermit) {
      redirect(`/vendor/permits/${fallbackPermit.id}/special-permits`)
    } else {
      redirect("/vendor")
    }
  }

  const [
    permit,
    masterSpecialPermits,
    masterWorkTypes,
    masterApd,
    masterSafetyChecks,
  ] = await Promise.all([
    prisma.permit.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
        permitKhusus: {
          include: {
            checks: {
              include: {
                masterSafetyCheck: true,
              },
            },
          },
        },
        daftarApd: {
          include: {
            masterApd: true,
          },
        },
      },
    }),
    prisma.specialPermit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.workType.findMany({
      where: { isActive: true },
      include: {
        subWorkTypes: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.masterApd.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.masterSafetyCheck.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!permit) {
    notFound()
  }

  if (
    session.user.role === "VENDOR" &&
    session.user.vendorId &&
    session.user.vendorId !== permit.vendorId
  ) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Anda tidak memiliki akses untuk mengisi atau menyunting permit khusus perusahaan lain.
      </div>
    )
  }

  const serializedPermit = {
    id: permit.id,
    nomor: permit.nomor,
    workName: permit.workName,
    location: permit.location,
    startDate: permit.startDate.toISOString(),
    endDate: permit.endDate.toISOString(),
    poNumber: permit.poNumber,
    spkNumber: permit.spkNumber,
    isHighRisk: permit.isHighRisk,
    vendor: permit.vendor,
    pic: permit.pic,
    user: permit.user,
  }

  const initialSpecialPermits = permit.permitKhusus.map((sp) => ({
    specialPermitId: sp.specialPermitId,
    workTypeId: sp.workTypeId,
    subWorkTypeId: sp.subWorkTypeId,
    informasiLain: sp.informasiLain,
    checks: sp.checks.map((chk) => ({
      masterSafetyCheckId: chk.masterSafetyCheckId,
      status: chk.status,
      notes: chk.notes,
      documentPath: chk.documentPath,
    })),
  }))

  const initialApdIds = permit.daftarApd
    .filter((a) => !a.customName)
    .map((a) => a.masterApdId)

  const initialCustomApds = permit.daftarApd
    .filter((a) => Boolean(a.customName))
    .map((a) => a.customName as string)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Form Izin Kerja Khusus (Permit Khusus) &amp; APD
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi checklist pekerjaan risiko tinggi, verifikasi cek keselamatan pra-kerja beserta upload berkas bukti, dan tentukan APD yang digunakan.
        </p>
      </div>

      <SpecialPermitsForm
        permit={serializedPermit}
        masterSpecialPermits={masterSpecialPermits}
        masterWorkTypes={masterWorkTypes}
        masterApd={masterApd}
        masterSafetyChecks={masterSafetyChecks}
        initialSpecialPermits={initialSpecialPermits}
        initialApdIds={initialApdIds}
        initialCustomApds={initialCustomApds}
        returnUrl="/vendor"
      />
    </div>
  )
}
