import { DefaultSession } from "next-auth"

declare module "next-auth" {
  // Memperluas tipe Session agar mengenali role, departmentId, dan vendorId
  interface Session {
    user: {
      id: string
      role: string
      departmentId: string
      vendorId?: string
    } & DefaultSession["user"]
  }

  // Memperluas tipe User agar mengenali role, departmentId, dan vendorId saat login
  interface User {
    role: string
    departmentId: string
    vendorId?: string
  }
}