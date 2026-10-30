import Link from "next/link"

export default function Sidebar({ role }: { role: string }) {
  // Menentukan menu berdasarkan role pengguna
  const getMenuLinks = () => {
    switch (role) {
      case "USER":
        return [{ name: "Dashboard User", href: "/user" }, { name: "Buat Permit", href: "/user/create" }]
      case "VENDOR":
        return [{ name: "Portal Vendor", href: "/vendor" }]
      case "PIC":
        return [{ name: "Verifikasi Area", href: "/pic" }]
      case "LP":
        return [{ name: "Verifikasi Legal/PO", href: "/lp" }]
      case "SHE":
        return [{ name: "Approval Akhir SHE", href: "/she" }, { name: "Master Data", href: "/she/master" }]
      case "SECURITY":
        return [{ name: "Pos Gerbang (Scan QR)", href: "/security" }]
      default:
        return []
    }
  }

  const links = getMenuLinks()

  return (
    <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
        e-WP System
      </div>
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="block px-6 py-2.5 hover:bg-slate-800 transition-colors">
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}