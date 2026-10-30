import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Navbar from "@/components/layout/Navbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Ambil data sesi pengguna saat ini
  const session = await auth()

  // Proteksi ganda: pastikan pengguna yang tidak login tidak bisa melihat layout ini
  if (!session?.user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <Sidebar role={session.user.role} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar userName={session.user.name || "User"} role={session.user.role} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}