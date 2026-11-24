import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function ensureDepartment(name: string) {
  const existing = await prisma.department.findFirst({ where: { name } })
  if (existing) return existing
  return prisma.department.create({ data: { name } })
}

async function ensureVendor(name: string, email: string, phone: string) {
  const existing = await prisma.vendor.findFirst({ where: { name } })
  if (existing) return existing
  return prisma.vendor.create({ data: { name, email, phone } })
}

async function main() {
  const deptShe = await ensureDepartment('Safety, Health & Environment (SHE)')
  const deptProduksi = await ensureDepartment('Produksi')
  const deptMaintenance = await ensureDepartment('Maintenance')

  const vendor1 = await ensureVendor('PT Karya Teknik Mandiri', 'kontak@karyateknik.co.id', '081234567890')
  const vendor2 = await ensureVendor('PT Mitra Konstruksi Nusantara', 'admin@mitrakonstruksi.co.id', '081298765432')
  const vendor3 = await ensureVendor('CV Elektro Jaya Abadi', 'info@elektrojaya.co.id', '081355551234')

  const usersToSeed: {
    username: string
    password: string
    full_name: string
    role: Role
    departmentId?: string
    vendorId?: string
  }[] = [
    {
      username: 'admin_she',
      password: 'password123',
      full_name: 'Administrator SHE',
      role: 'SHE',
      departmentId: deptShe.id,
    },
    {
      username: 'user_internal',
      password: 'password123',
      full_name: 'Pemohon Internal Produksi',
      role: 'USER',
      departmentId: deptProduksi.id,
    },
    {
      username: 'pic_area',
      password: 'password123',
      full_name: 'Budi Santoso (PIC Area)',
      role: 'PIC',
      departmentId: deptMaintenance.id,
    },
    {
      username: 'pengawas_k3',
      password: 'password123',
      full_name: 'Agus Wijaya (Pengawas Kerja)',
      role: 'SHE',
      departmentId: deptShe.id,
    },
    {
      username: 'lp_legal',
      password: 'password123',
      full_name: 'Tim Legal & Procurement',
      role: 'LP',
      departmentId: deptProduksi.id,
    },
    {
      username: 'security_pos',
      password: 'password123',
      full_name: 'Petugas Pos Security',
      role: 'SECURITY',
      departmentId: deptShe.id,
    },
    {
      username: 'vendor_karya',
      password: 'password123',
      full_name: 'PT Karya Teknik Mandiri (Vendor)',
      role: 'VENDOR',
      vendorId: vendor1.id,
    },
  ]

  for (const userData of usersToSeed) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: {
        role: userData.role,
        vendorId: userData.vendorId,
      },
      create: userData,
    })
  }

  const electricalItems = [
    'Stop Kontak Industri 1-Phase (16A / 220V - IP44/IP67)',
    'Stop Kontak Industri 3-Phase (32A / 380V - 5 Pin)',
    'Panel Distribusi Portabel dengan ELCB / RCBO (IP65)',
    'Sambungan Kabel Tray / Heavy Duty Extension Reel (Grounding Aktif)',
  ]

  for (const name of electricalItems) {
    const existing = await prisma.masterElectrical.findFirst({ where: { name } })
    if (!existing) {
      await prisma.masterElectrical.create({ data: { name } })
    }
  }

  const specialPermits = [
    'Izin Kerja Panas (Hot Work - Pengelasan/Pemotongan/Gerinda Api)',
    'Izin Kerja Ketinggian (Working at Height > 1.8 Meter)',
    'Izin Kerja Ruang Terbatas (Confined Space - Tangki/Silo/Saluran)',
    'Izin Penggalian Tanah (Excavation Depth > 1 Meter)',
    'Izin Isolasi Energi Kelistrikan & LOTO',
  ]

  for (const name of specialPermits) {
    const existing = await prisma.specialPermit.findFirst({ where: { name } })
    if (!existing) {
      await prisma.specialPermit.create({ data: { name } })
    }
  }

  const apdItems = [
    'Helm Keselamatan (Safety Helmet)',
    'Sepatu Pelindung (Safety Shoes / Boots)',
    'Kacamata Pelindung (Safety Glasses / Goggles)',
    'Pelindung Wajah (Full Face Shield)',
    'Sarung Tangan Kulit / Las (Welding Gloves)',
    'Sarung Tangan Kimia / Karet (Nitrile / Neoprene)',
    'Tali Pengaman Tubuh (Full Body Harness with Lanyard)',
    'Masker Debu & Partikel (N95 / Respirator Gas)',
    'Penyumbat Telinga (Ear Plug / Ear Muff)',
    'Rompi Reflektif (High-Visibility Vest)',
  ]

  for (const name of apdItems) {
    const existing = await prisma.masterApd.findFirst({ where: { name } })
    if (!existing) {
      await prisma.masterApd.create({ data: { name } })
    }
  }

  const safetyChecks = [
    'Area kerja telah dibersihkan dari material mudah terbakar (radius min. 10 meter)',
    'Alat Pemadam Api Ringan (APAR) tipe serbuk kimia / CO2 siap pakai di lokasi',
    'Gas tester telah menguji kadar O2 (19.5%-23.5%) dan LEL gas mudah terbakar (< 5%)',
    'Full body harness & lifeline telah diinspeksi dan terpasang pada anchor point kokoh',
    'Sistem ventilasi udara / blower terpasang dan berfungsi optimal di ruang terbatas',
    'Barikade, safety line, dan rambu peringatan bahaya terpasang mengelilingi area kerja',
    'Sumber energi telah diisolasi dan dipasang gembok pengaman / LOTO',
    'Petugas Safety Watcher / Pengawas siaga berada di lokasi selama pekerjaan berlangsung',
  ]

  for (const name of safetyChecks) {
    const existing = await prisma.masterSafetyCheck.findFirst({ where: { name } })
    if (!existing) {
      await prisma.masterSafetyCheck.create({ data: { name } })
    }
  }

  const borrowedItems = [
    'Multi-Gas Detector 4-Gas (O2, LEL, CO, H2S) + Sertifikat Kalibrasi',
    'Tripod Rescue & Winch Confined Space System (Kapasitas 500kg)',
    'Blower Ventilasi Ruang Terbatas + Selang Spiral 10m (Explosion Proof)',
    'Self-Contained Breathing Apparatus (SCBA) 300 Bar',
    'Alat Pemadam Api Ringan (APAR) Roda Trolley 25kg (Dry Powder)',
    'Tangga Fiber Non-Konduktif Dielektrik (Panjang 6 Meter)',
    'Exhaust Fan Portable Portabel Industri (Air Mover)',
    'Detector Arus / Voltase Nirkabel Tegangan Tinggi',
  ]

  for (const name of borrowedItems) {
    const existing = await prisma.masterBorrowedItem.findFirst({ where: { name } })
    if (!existing) {
      await prisma.masterBorrowedItem.create({ data: { name } })
    }
  }

  console.log('Seeding data awal berhasil!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
