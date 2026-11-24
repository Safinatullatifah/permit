import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import JsaForm from "@/components/jsa/JsaForm"

interface VendorJsaPageProps {
  params: Promise<{ id: string }>
}

export default async function VendorJsaPage({ params }: VendorJsaPageProps) {
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
      redirect(`/vendor/permits/${fallbackPermit.id}/jsa`)
    } else {
      redirect("/vendor")
    }
  }

  const [permit, availableElectrical] = await Promise.all([
    prisma.permit.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true } },
        pic: { select: { id: true, full_name: true } },
        user: { select: { id: true, full_name: true } },
        jsa: {
          include: {
            tahapan: {
              orderBy: { urutan: "asc" },
              include: {
                bahaya: {
                  orderBy: { urutan: "asc" },
                  include: {
                    pengendalian: {
                      orderBy: { urutan: "asc" },
                    },
                  },
                },
              },
            },
            peralatan: {
              orderBy: { createdAt: "asc" },
            },
            sambungan: {
              include: {
                masterElectrical: true,
              },
            },
          },
        },
      },
    }),
    prisma.masterElectrical.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!permit) {
    notFound()
  }

  // Cek otorisasi vendor: akun VENDOR yang memiliki vendorId hanya dapat mengisi permit vendor miliknya
  if (
    session.user.role === "VENDOR" &&
    session.user.vendorId &&
    session.user.vendorId !== permit.vendorId
  ) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        Anda tidak memiliki akses untuk mengisi atau menyunting JSA untuk permit perusahaan lain.
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

  const serializedJsa = permit.jsa
    ? {
        isElectrical: permit.jsa.isElectrical,
        tahapan: permit.jsa.tahapan.map((t) => ({
          text: t.text,
          bahaya: t.bahaya.map((b) => ({
            text: b.text,
            pengendalian: b.pengendalian.map((p) => ({ text: p.text })),
          })),
        })),
        peralatan: permit.jsa.peralatan.map((p) => ({
          nama: p.nama,
          itemSafety: p.itemSafety,
          jumlah: p.jumlah,
          imageUrl: p.imageUrl,
        })),
        sambungan: permit.jsa.sambungan.map((s) => ({
          masterElectricalId: s.masterElectricalId,
          notes: s.notes,
        })),
      }
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Form Pengisian Job Safety Analysis (JSA)
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lengkapi analisis keselamatan kerja, daftar mesin/peralatan, dan kebutuhan arus listrik sebelum izin kerja diajukan ke tahap verifikasi berikutnya.
        </p>
      </div>

      <JsaForm
        permit={serializedPermit}
        initialJsa={serializedJsa}
        availableElectrical={availableElectrical}
        returnUrl="/vendor"
      />
    </div>
  )
}
