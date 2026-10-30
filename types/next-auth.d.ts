import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  // Memperluas tipe Session agar mengenali role dan departmentId
  interface Session {
    user: {
      id: string
      role: string
      departmentId: string
    } & DefaultSession["user"]
  }

  // Memperluas tipe User agar mengenali role dan departmentId saat login
  interface User {
    role: string
    departmentId: string
  }
}