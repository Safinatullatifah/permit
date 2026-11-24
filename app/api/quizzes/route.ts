import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  parseChoicesJson,
  quizPayloadSchema,
  removeQuizImage,
  saveQuizImage,
} from "@/lib/quiz-utils"

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        choices: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(quizzes)
  } catch (error) {
    console.error("GET /api/quizzes error:", error)
    return NextResponse.json(
      { error: "Gagal mengambil bank soal kuis" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const question = formData.get("question")
    const rawChoices = formData.get("choices")
    const imageEntry = formData.get("image")

    const parsed = quizPayloadSchema.safeParse({
      question: typeof question === "string" ? question : "",
      choices: parseChoicesJson(rawChoices),
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data soal tidak valid" },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null
    if (imageEntry instanceof File && imageEntry.size > 0) {
      try {
        imageUrl = await saveQuizImage(imageEntry)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Format gambar tidak valid"
        return NextResponse.json({ error: message }, { status: 400 })
      }
    }

    const quiz = await prisma.quiz.create({
      data: {
        question: parsed.data.question,
        imageUrl,
        choices: {
          create: parsed.data.choices.map((choice) => ({
            text: choice.text,
            isCorrect: choice.isCorrect,
          })),
        },
      },
      include: {
        choices: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json(
      { message: "Soal kuis berhasil ditambahkan", quiz },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/quizzes error:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan soal kuis" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID soal wajib disertakan" }, { status: 400 })
    }

    const existing = await prisma.quiz.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
    }

    await removeQuizImage(existing.imageUrl)
    await prisma.quiz.delete({ where: { id } })

    return NextResponse.json({ message: "Soal kuis berhasil dihapus" })
  } catch (error) {
    console.error("DELETE /api/quizzes error:", error)
    return NextResponse.json(
      { error: "Gagal menghapus soal kuis" },
      { status: 500 }
    )
  }
}
