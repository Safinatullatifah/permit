import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const body = await req.json();
    const { permitId, answers } = body as {
      permitId: string;
      answers: Record<string, string>; // quizId -> choiceId
    };

    if (!permitId || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { message: "Data pengiriman jawaban tidak valid" },
        { status: 400 }
      );
    }

    // Verify member and permit existence
    const member = await prisma.memberPermit.findFirst({
      where: {
        id: memberId,
        permitId: permitId,
      },
      include: {
        permit: {
          include: {
            vendor: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { message: "Data pekerja atau izin kerja tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get active quizzes and their choices
    const quizzes = await prisma.quiz.findMany({
      where: { isActive: true },
      include: { choices: true },
    });

    if (quizzes.length === 0) {
      return NextResponse.json(
        { message: "Belum ada soal kuis yang aktif dalam sistem" },
        { status: 500 }
      );
    }

    // Calculate score
    let correctCount = 0;
    const totalCount = quizzes.length;
    const answerEntries: { quizId: string; choiceId: string }[] = [];

    for (const q of quizzes) {
      const selectedChoiceId = answers[q.id];
      if (selectedChoiceId) {
        answerEntries.push({ quizId: q.id, choiceId: selectedChoiceId });
        const correctChoice = q.choices.find((c) => c.isCorrect);
        if (correctChoice && correctChoice.id === selectedChoiceId) {
          correctCount++;
        }
      }
    }

    const score = Math.round((correctCount / totalCount) * 100);
    const PASSING_GRADE = 80; // Minimum 80% to pass
    const isPassed = score >= PASSING_GRADE;

    // Database transaction to save results
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Delete previous answers for this member if retaking
      await tx.memberAnswer.deleteMany({
        where: { memberId },
      });

      // 2. Insert new answers
      for (const entry of answerEntries) {
        await tx.memberAnswer.create({
          data: {
            memberId,
            quizId: entry.quizId,
            choiceId: entry.choiceId,
          },
        });
      }

      // 3. Upsert QuizResult
      const quizResult = await tx.quizResult.upsert({
        where: { memberId },
        update: {
          score,
          isPassed,
          isCompleted: true,
          completedAt: new Date(),
        },
        create: {
          memberId,
          score,
          isPassed,
          isCompleted: true,
          completedAt: new Date(),
        },
      });

      // 4. If passed, generate or update Certificate
      let certificate = null;
      if (isPassed) {
        // Expiration: 6 months from now
        const expiredAt = new Date();
        expiredAt.setMonth(expiredAt.getMonth() + 6);

        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, "0");
        const uniqueSuffix = memberId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
        const certNumber = `CERT-K3-${year}${month}-${uniqueSuffix}`;

        certificate = await tx.certificate.upsert({
          where: { memberId },
          update: {
            nomor: certNumber,
            isValid: true,
            expiredAt,
          },
          create: {
            memberId,
            nomor: certNumber,
            isValid: true,
            expiredAt,
          },
        });
      }

      return { quizResult, certificate };
    });

    return NextResponse.json({
      message: isPassed
        ? "Selamat! Anda dinyatakan Lulus Safety Induction."
        : `Skor Anda: ${score} (Minimal ${PASSING_GRADE}). Silakan pelajari kembali materi dan ulangi kuis.`,
      score,
      isPassed,
      correctCount,
      totalCount,
      quizResult: result.quizResult,
      certificate: result.certificate,
    });
  } catch (error) {
    console.error("POST /api/induction/[memberId]/submit error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat memproses jawaban kuis" },
      { status: 500 }
    );
  }
}
