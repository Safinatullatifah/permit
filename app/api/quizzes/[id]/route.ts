import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import {
  parseChoicesJson,
  quizPatchSchema,
  removeQuizImage,
  saveQuizImage,
} from "@/lib/quiz-utils"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const existing = await prisma.quiz.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
    }

    const contentType = req.headers.get("content-type") || ""

    // Mendukung JSON (misal toggle isActive) maupun FormData (edit soal + gambar)
    if (contentType.includes("application/json")) {
      const body = await req.json()
      const parsed = quizPatchSchema.safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Data pembaruan tidak valid" },
          { status: 400 }
        )
      }

      const updated = await prisma.$transaction(async (tx) => {
        if (parsed.data.choices) {
          await tx.choices.deleteMany({ where: { quizId: id } })
        }

        return tx.quiz.update({
          where: { id },
          data: {
            ...(parsed.data.question !== undefined ? { question: parsed.data.question } : {}),
            ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
            ...(parsed.data.choices
              ? {
                  choices: {
                    create: parsed.data.choices.map((c) => ({
                      text: c.text,
                      isCorrect: c.isCorrect,
                    })),
                  },
                }
              : {}),
          },
          include: {
            choices: { orderBy: { createdAt: "asc" } },
          },
        })
      })

      return NextResponse.json({ message: "Soal berhasil diperbarui", quiz: updated })
    }

    const formData = await req.formData()
    const question = formData.get("question")
    const rawChoices = formData.get("choices")
    const imageEntry = formData.get("image")
    const removeImage = formData.get("removeImage") === "true"

    const parsed = quizPatchSchema.safeParse({
      question: typeof question === "string" ? question : undefined,
      choices: rawChoices !== null ? parseChoicesJson(rawChoices) : undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data pembaruan tidak valid" },
        { status: 400 }
      )
    }

    let nextImageUrl = existing.imageUrl
    if (removeImage) {
      await removeQuizImage(existing.imageUrl)
      nextImageUrl = null
    }

    if (imageEntry instanceof File && imageEntry.size > 0) {
      let uploadedUrl: string
      try {
        uploadedUrl = await saveQuizImage(imageEntry)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Format gambar tidak valid"
        return NextResponse.json({ error: message }, { status: 400 })
      }
      await removeQuizImage(existing.imageUrl)
      nextImageUrl = uploadedUrl
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (parsed.data.choices) {
        await tx.choices.deleteMany({ where: { quizId: id } })
      }

      return tx.quiz.update({
        where: { id },
        data: {
          ...(parsed.data.question !== undefined ? { question: parsed.data.question } : {}),
          imageUrl: nextImageUrl,
          ...(parsed.data.choices
            ? {
                choices: {
                  create: parsed.data.choices.map((c) => ({
                    text: c.text,
                    isCorrect: c.isCorrect,
                  })),
                },
              }
            : {}),
        },
        include: {
          choices: { orderBy: { createdAt: "asc" } },
        },
      })
    })

    return NextResponse.json({ message: "Soal berhasil diperbarui", quiz: updated })
  } catch (error) {
    console.error("PATCH /api/quizzes/[id] error:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui soal kuis" },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const existing = await prisma.quiz.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 })
    }

    await removeQuizImage(existing.imageUrl)
    await prisma.quiz.delete({ where: { id } })

    return NextResponse.json({ message: "Soal kuis berhasil dihapus" })
  } catch (error) {
    console.error("DELETE /api/quizzes/[id] error:", error)
    return NextResponse.json(
      { error: "Gagal menghapus soal kuis" },
      { status: 500 }
    )
  }
}
