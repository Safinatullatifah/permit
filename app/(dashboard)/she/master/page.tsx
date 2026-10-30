import { getDepartments, createDepartment, deleteDepartment } from "@/app/actions/department"

export default async function MasterDataPage() {
  // Mengambil data langsung dari server action
  const departments = await getDepartments()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Master Data: Departemen</h1>
      
      {/* Form Tambah Departemen */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Tambah Departemen Baru</h2>
        
        {/* Form ini memanggil createDepartment langsung dari server */}
        <form action={async (formData) => {
  "use server"
  await createDepartment(formData)
}} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Departemen
            </label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              required
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="Contoh: Maintenance"
            />
          </div>
          <button type="submit" className="bg-slate-900 text-white px-5 py-2 rounded-md hover:bg-slate-800 transition font-medium">
            Simpan
          </button>
        </form>
      </div>

      {/* Tabel Daftar Departemen */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Departemen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {departments.map((dept, index) => (
              <tr key={dept.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {dept.isActive ? 'Aktif' : 'Non-aktif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Tombol Hapus dengan Server Action Inline */}
                  <form action={async () => {
                    "use server"
                    await deleteDepartment(dept.id)
                  }}>
                    <button type="submit" className="text-red-600 hover:text-red-900 transition">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  Belum ada data departemen. Silakan tambahkan pada form di atas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}