import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke e-WP</h1>
          <p className="text-sm text-gray-500 mt-2">Sistem Electronic Work Permit</p>
        </div>

        <form 
          action={async (formData) => {
            "use server"
            try {
              // Langsung passing formData bawaan
              await signIn("credentials", formData, { redirectTo: "/she/master" })
            } catch (error) {
              // Jika terjadi error dari NextAuth (selain redirect), kita tangkap di sini
              if (error instanceof AuthError) {
                console.log("Gagal login:", error.type)
              }
              // Wajib di-throw ulang agar Next.js bisa melakukan navigasi halaman (redirect)
              throw error 
            }
          }} 
          className="space-y-5"
        >
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input 
              type="text" 
              name="username" 
              id="username" 
              required 
              defaultValue="admin_she" // Nilai default agar mudah dites
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              required 
              defaultValue="password123" // Nilai default agar mudah dites
              className="w-full border-gray-300 rounded-md shadow-sm border p-2 focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  )
}