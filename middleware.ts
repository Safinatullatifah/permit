import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Daftar rute publik (boleh diakses tanpa login)
  const isPublicRoute = 
    pathname.startsWith('/api/auth') || 
    pathname === '/sign-in' || 
    pathname === '/vendor-sign-in' || 
    pathname.startsWith('/induction') // Halaman publik untuk pekerja[cite: 3, 5]

  // Jika belum login dan mencoba masuk ke halaman terproteksi, lempar ke halaman sign-in
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  return NextResponse.next()
})

// Tentukan rute mana saja yang akan diawasi oleh middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}