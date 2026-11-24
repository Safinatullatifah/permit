import { 
  getApds, createApd, deleteApd,
  getSafetyChecks, createSafetyCheck, deleteSafetyCheck,
  getBorrowedItems, createBorrowedItem, deleteBorrowedItem,
  getElectricals, createElectrical, deleteElectrical
} from "@/app/actions/master-keselamatan"

interface SafetyItem {
  id: string
  name: string
}

interface DataTableProps {
  title: string
  data: SafetyItem[]
  createAction: (formData: FormData) => Promise<unknown>
  deleteAction: (id: string) => Promise<unknown>
  placeholder: string
}

export default async function MasterKeselamatanPage() {
  const [apds, safetyChecks, borrowedItems, electricals] = await Promise.all([
    getApds(), getSafetyChecks(), getBorrowedItems(), getElectricals()
  ])

  // Komponen Tabel Reusable agar kode lebih ringkas
  const DataTable = ({ title, data, createAction, deleteAction, placeholder }: DataTableProps) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h2>
      
      <form action={async (formData) => { "use server"; await createAction(formData) }} className="flex gap-2 mb-4">
        <input type="text" name="name" required placeholder={placeholder} className="flex-1 border p-2 rounded-md text-sm" />
        <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 text-sm">Simpan</button>
      </form>

      <div className="overflow-y-auto flex-1 max-h-64 border rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-2 text-right text-sm">
                  <form action={async () => { "use server"; await deleteAction(item.id) }}>
                    <button type="submit" className="text-red-600 hover:text-red-900 text-xs">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-4 text-center text-xs text-gray-500">Belum ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-800">Master Data: Aspek Keselamatan</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DataTable title="1. Master APD" data={apds} createAction={createApd} deleteAction={deleteApd} placeholder="Contoh: Helm Safety" />
        <DataTable title="2. Cek Keselamatan" data={safetyChecks} createAction={createSafetyCheck} deleteAction={deleteSafetyCheck} placeholder="Contoh: Cek Gas Beracun" />
        <DataTable title="3. Barang Pinjam" data={borrowedItems} createAction={createBorrowedItem} deleteAction={deleteBorrowedItem} placeholder="Contoh: Blower" />
        <DataTable title="4. Sambungan Elektrikal" data={electricals} createAction={createElectrical} deleteAction={deleteElectrical} placeholder="Contoh: Kabel Roll" />
      </div>
    </div>
  )
}