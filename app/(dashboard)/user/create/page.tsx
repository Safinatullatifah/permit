import prisma from "@/lib/prisma"
import CreatePermitForm from "./CreatePermitForm"

export default async function CreatePermitPage() {
  const [vendors, picUsers, internalUsers] = await Promise.all([
    prisma.vendor.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "PIC" },
      include: { department: true },
      orderBy: { full_name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SHE", "PIC", "USER"] } },
      include: { department: true },
      orderBy: { full_name: "asc" },
    }),
  ])

  const vendorOptions = vendors.map((v) => ({
    id: v.id,
    label: v.name,
  }))

  const picOptions = picUsers.map((u) => ({
    id: u.id,
    label: u.full_name,
    subLabel: u.department?.name || u.role,
  }))

  const pengawasOptions = internalUsers.map((u) => ({
    id: u.id,
    label: u.full_name,
    subLabel: u.department?.name || u.role,
  }))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Buat Permohonan Work Permit Baru
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi informasi pekerjaan, jadwal pelaksanaan, pihak terkait, serta Nomor PO atau SPK. Nomor izin kerja akan dibuat otomatis oleh sistem.
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <CreatePermitForm
          vendors={vendorOptions}
          pics={picOptions}
          pengawasList={pengawasOptions}
        />
      </div>
    </div>
  )
}
