import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import BorrowedEquipmentForm from "@/components/borrowed-equipment/BorrowedEquipmentForm"

interface VendorBorrowedEquipmentPageProps {
  params: Promise<{ id: string }>
}

export default async function VendorBorrowedEquipmentPage({
  params,
}: VendorBorrowedEquipmentPageProps) {
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
      redirect(`/vendor/permits/${fallbackPermit.id}/borrowed-equipment`)
    } else {
      redirect("/vendor")
    }
  }

  const [permit, masterBorrowedItems] = await Promise.all([
    prisma.permit.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
        pinjamEquipment: {
          include: {
            barang: true,
          },
          orderBy: { createdAt: "asc" },
        },
        barangBawaan: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.masterBorrowedItem.findMany({
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
        Anda tidak memiliki akses untuk mengajukan peminjaman alat pada permit perusahaan lain.
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

  const initialEquipment = permit.pinjamEquipment.map((item) => ({
    barangId: item.barangId,
    jumlah: item.jumlah,
    catatan: item.catatan || "",
    status: item.status,
  }))

  const initialMaterial = permit.barangBawaan.map((mat) => ({
    nama: mat.nama,
    jumlah: mat.jumlah,
    satuan: mat.satuan || "unit",
    catatan: mat.catatan || "",
  }))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Peminjaman Alat K3 Pabrik &amp; Material Bawaan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajukan permohonan peminjaman peralatan K3 standar dari gudang keselamatan pabrik dan catat barang/material yang dibawa masuk ke area kerja.
        </p>
      </div>

      <BorrowedEquipmentForm
        permit={serializedPermit}
        masterBorrowedItems={masterBorrowedItems}
        initialEquipment={initialEquipment}
        initialMaterial={initialMaterial}
        returnUrl="/vendor"
      />
    </div>
  )
}
