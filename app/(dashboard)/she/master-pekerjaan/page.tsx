import { 
  getSpecialPermits, createSpecialPermit, deleteSpecialPermit,
  getWorkTypes, createWorkType, deleteWorkType,
  getSubWorkTypes, createSubWorkType, deleteSubWorkType
} from "@/app/actions/master-pekerjaan"

export default async function MasterPekerjaanPage() {
  // Tarik semua data secara paralel agar loading lebih cepat
  const [specialPermits, workTypes, subWorkTypes] = await Promise.all([
    getSpecialPermits(),
    getWorkTypes(),
    getSubWorkTypes()
  ])

  return (
    <div className="space-y-10 pb-10">
      <h1 className="text-2xl font-bold text-gray-800">Master Data: Pekerjaan & Permit</h1>

      {/* SECTION 1: PERMIT KHUSUS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">1. Permit Khusus</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form action={async (formData) => { "use server"; await createSpecialPermit(formData) }} className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Permit Khusus</label>
              <input type="text" name="name" required placeholder="Contoh: Hot Work Permit" className="w-full border p-2 rounded-md" />
            </div>
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800">Simpan</button>
          </form>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Permit Khusus</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {specialPermits.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <form action={async () => { "use server"; await deleteSpecialPermit(item.id) }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 2: JENIS PEKERJAAN */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">2. Jenis Pekerjaan</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form action={async (formData) => { "use server"; await createWorkType(formData) }} className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Jenis Pekerjaan</label>
              <input type="text" name="name" required placeholder="Contoh: Pekerjaan Sipil" className="w-full border p-2 rounded-md" />
            </div>
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800">Simpan</button>
          </form>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Jenis Pekerjaan</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workTypes.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <form action={async () => { "use server"; await deleteWorkType(item.id) }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: SUB-JENIS PEKERJAAN */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">3. Sub-Jenis Pekerjaan</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <form action={async (formData) => { "use server"; await createSubWorkType(formData) }} className="flex gap-4 items-end mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Induk (Jenis Pekerjaan)</label>
              <select name="workTypeId" required className="w-full border p-2 rounded-md bg-white">
                <option value="">- Pilih Jenis Pekerjaan -</option>
                {workTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tambah Sub-Jenis</label>
              <input type="text" name="name" required placeholder="Contoh: Pengecoran Beton" className="w-full border p-2 rounded-md" />
            </div>
            <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800">Simpan</button>
          </form>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub-Jenis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Induk (Jenis Pekerjaan)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subWorkTypes.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.workType.name}</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <form action={async () => { "use server"; await deleteSubWorkType(item.id) }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">Hapus</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}