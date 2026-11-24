import { redirect } from "next/navigation"

export default function RootPage() {
  // Langsung arahkan pengguna ke halaman sign-in saat membuka localhost:3000
  redirect("/sign-in")
}