import prisma from "@/lib/prisma"
import UploadForm from "./UploadForm"
import { revalidatePath } from "next/cache"

// Server Action untuk hapus data (hanya metadata dari DB)
async function deleteMateri(id: string) {
  "use server"
  await prisma.k3Material.delete({ where: { id } })
  revalidatePath("/she/materi-k3")
}

export default async function MateriK3Page() {
  // Ambil data langsung dari database (Server Component)
  const materials = await prisma.k3Material.findMany({
    orderBy: { created_at: 'desc' }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Manajemen Materi K3</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Upload Materi Baru</h2>
        
        {/* Render Form Upload */}
        <UploadForm />

        {/* Tabel Daftar Materi */}
        <div className="mt-8 border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Judul Materi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Link</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map((materi) => (
                <tr key={materi.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{materi.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${materi.fileType === 'PDF' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {materi.fileType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                    <a href={materi.fileUrl} target="_blank" rel="noopener noreferrer">Lihat File</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <form action={async () => { "use server"; await deleteMateri(materi.id) }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Belum ada materi K3 yang diunggah.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}