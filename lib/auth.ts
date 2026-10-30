import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        
        // Cari user di database
        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string }
        })

        if (!user) return null

        // PENTING: Untuk tahap awal (seeder), kita mencocokkan password teks biasa.
        // Nanti password harus di-hash menggunakan bcrypt.compareSync
        const passwordsMatch = credentials.password === user.password

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.full_name,
            role: user.role,
            departmentId: user.departmentId
          }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.departmentId = user.departmentId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string
        session.user.departmentId = token.departmentId as string
      }
      return session
    },
  },
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
})