import { signOut } from "@/lib/auth"
import { NotificationBell } from "./NotificationBell"

export default function Navbar({ userName, role }: { userName: string, role: string }) {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="font-semibold text-gray-700 md:hidden">
        e-WP Mobile
      </div>
      <div className="hidden md:block"></div> {/* Spacer untuk desktop */}
      
      <div className="flex items-center gap-4">
        {/* Lonceng Notifikasi Sistem */}
        <NotificationBell />

        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500 uppercase">{role}</p>
        </div>
        
        {/* Tombol Logout menggunakan Server Action Auth.js */}
        <form action={async () => {
          "use server"
          await signOut({ redirectTo: "/sign-in" })
        }}>
          <button type="submit" className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors">
            Logout
          </button>
        </form>
      </div>
    </header>
  )
}