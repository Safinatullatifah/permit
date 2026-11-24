import prisma from "../lib/prisma";

async function main() {
  console.log("Seeding K3 Safety Induction Quizzes...");

  const questions = [
    {
      question:
        "Apa tindakan pertama yang harus dilakukan oleh seluruh pekerja jika mendengar sirine evakuasi darurat berbunyi di area pabrik?",
      choices: [
        { text: "Menunggu instruksi lebih lanjut dari mandor", isCorrect: false },
        {
          text: "Segera hentikan pekerjaan, matikan sumber api/listrik, dan bergerak tenang menuju Assembly Point (Titik Kumpul) melalui jalur evakuasi",
          isCorrect: true,
        },
        { text: "Terus melanjutkan pekerjaan sampai jam kerja selesai", isCorrect: false },
        { text: "Bersembunyi di dalam ruangan terdekat", isCorrect: false },
      ],
    },
    {
      question:
        "Alat Pelindung Diri (APD) standar wajib minimum yang harus dipakai setiap saat memasuki area operasional pabrik adalah:",
      choices: [
        {
          text: "Helm Keselamatan (Safety Helmet), Sepatu Keselamatan (Safety Shoes), dan Rompi Reflektif / High-Vis",
          isCorrect: true,
        },
        { text: "Sandal jepit dan kacamata hitam", isCorrect: false },
        { text: "Hanya kaos oblong dan masker kain", isCorrect: false },
        { text: "Topi santai dan sarung tangan kain biasa", isCorrect: false },
      ],
    },
    {
      question:
        "Kapan pekerjaan di ketinggian (bekerja di atas 1.8 meter dari permukaan lantai) diperbolehkan untuk dilaksanakan?",
      choices: [
        { text: "Kapan saja jika pekerja sudah berpengalaman tanpa perlu izin", isCorrect: false },
        {
          text: "Setelah Permit Kerja Ketinggian disetujui, scaffold/tangga telah di-tag inspeksi aman, dan pekerja mengaitkan Full Body Harness 100% tie-off",
          isCorrect: true,
        },
        { text: "Cukup menggunakan tangga bambu tanpa tali pengaman", isCorrect: false },
        { text: "Jika pekerjaan hanya berlangsung singkat kurang dari 5 menit", isCorrect: false },
      ],
    },
    {
      question:
        "Sebelum pekerjaan panas (Hot Work: mengelas, memotong, gerinda) dimulai, jarak aman pembersihan dari material mudah terbakar adalah:",
      choices: [
        { text: "50 sentimeter", isCorrect: false },
        {
          text: "Radius minimal 10 - 11 meter dibersihkan dari bahan mudah terbakar dan wajib menyiagakan APAR di titik kerja",
          isCorrect: true,
        },
        { text: "1 meter tanpa perlu alat pemadam api ringan", isCorrect: false },
        { text: "Tidak perlu dibersihkan selama ada ember air", isCorrect: false },
      ],
    },
    {
      question:
        "Apa tujuan utama dari penerapan prosedur LOTO (Lockout & Tagout) sebelum melakukan pekerjaan mekanik atau kelistrikan?",
      choices: [
        { text: "Untuk mengunci pintu gedung agar tidak ada yang masuk", isCorrect: false },
        {
          text: "Mengisolasi sumber energi berbahaya secara fisik agar mesin/arus listrik tidak aktif mendadak saat teknisi sedang bekerja",
          isCorrect: true,
        },
        { text: "Menandai kepemilikan peralatan milik vendor rekanan", isCorrect: false },
        { text: "Sebagai formalitas administrasi dokumen pabrik", isCorrect: false },
      ],
    },
    {
      question:
        "Jika terjadi kecelakaan kerja, luka ringan, atau kondisi berbahaya nyaris celaka (Near Miss), apa kewajiban Anda?",
      choices: [
        { text: "Menutup-nutupinya agar tidak dimarahi atau dipotong upah", isCorrect: false },
        {
          text: "Segera laporkan kepada Pengawas Vendor, PIC Area Pabrik, dan Tim SHE setempat untuk penanganan dan investigasi pencegahan",
          isCorrect: true,
        },
        { text: "Langsung meninggalkan area kerja dan pulang ke rumah", isCorrect: false },
        { text: "Mengunggah foto kejadian ke media sosial", isCorrect: false },
      ],
    },
  ];

  for (const q of questions) {
    const existing = await prisma.quiz.findFirst({
      where: { question: q.question },
    });

    if (!existing) {
      await prisma.quiz.create({
        data: {
          question: q.question,
          choices: {
            create: q.choices,
          },
        },
      });
      console.log(`Created quiz: ${q.question.slice(0, 40)}...`);
    } else {
      console.log(`Quiz already exists: ${q.question.slice(0, 40)}...`);
    }
  }

  console.log("K3 Safety Induction Quizzes seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
