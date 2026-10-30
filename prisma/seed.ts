import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const deptShe = await prisma.department.create({
    data: { name: 'Safety, Health & Environment (SHE)' }
  })

  const adminShe = await prisma.user.create({
    data: {
      username: 'admin_she',
      password: 'password123', 
      full_name: 'Administrator SHE',
      role: 'SHE',
      departmentId: deptShe.id
    }
  })

  console.log('Seeding data awal berhasil!', { adminShe })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })