import { getUsers, createUser, deleteUser } from "@/app/actions/user"
import { getDepartments } from "@/app/actions/department"

export default async function MasterUserPage() {
  const users = await getUsers()
  const departments = await getDepartments() // Mengambil daftar departemen untuk dropdown

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Master Data: Pengguna Sistem</h1>
      
      {/* Form Tambah User */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Tambah Pengguna (Internal / PIC / Pengawas)</h2>
        
        <form action={async (formData) => {
          "use server"
          await createUser(formData)
        }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" name="username" required className="w-full border p-2 rounded-md" />
          </div>
          
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" name="password" required className="w-full border p-2 rounded-md" />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" name="fullName" required className="w-full border p-2 rounded-md" />
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Role / Peran</label>
            <select name="role" required className="w-full border p-2 rounded-md bg-white">
              <option value="USER">User Internal</option>
              <option value="PIC">PIC / Verifikator Area</option>
              <option value="SHE">Pengawas / SHE</option>
              <option value="LP">Legal / PO</option>
              <option value="SECURITY">Security</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Departemen</label>
            <select name="departmentId" className="w-full border p-2 rounded-md bg-white">
              <option value="">- Pilih Departemen -</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded-md hover:bg-slate-800 transition">
              Simpan
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Lengkap</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departemen</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.full_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.department?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <form action={async () => {
                    "use server"
                    await deleteUser(user.id)
                  }}>
                    <button type="submit" className="text-red-600 hover:text-red-900 transition">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}