import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SafetyInductionPortal } from "@/components/induction/SafetyInductionPortal";

interface InductionPageProps {
  params: Promise<{
    permitId: string;
    memberId: string;
  }>;
}

export default async function InductionPage({ params }: InductionPageProps) {
  const { permitId, memberId } = await params;

  // Public access: fetch member, permit, quizResult, and certificate
  const member = await prisma.memberPermit.findFirst({
    where: {
      id: memberId,
      permitId: permitId,
    },
    include: {
      permit: {
        include: {
          vendor: { select: { id: true, name: true } },
        },
      },
      quizResult: true,
      certificate: true,
    },
  });

  if (!member || !member.permit) {
    notFound();
  }

  // Fetch active quizzes WITHOUT leaking `isCorrect` to the frontend client
  const quizzes = await prisma.quiz.findMany({
    where: { isActive: true },
    select: {
      id: true,
      question: true,
      imageUrl: true,
      choices: {
        select: {
          id: true,
          text: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SafetyInductionPortal
      member={{
        id: member.id,
        name: member.name,
        idCardNumber: member.idCardNumber,
        position: member.position,
        phone: member.phone,
        permitId: member.permitId,
      }}
      permit={{
        id: member.permit.id,
        nomor: member.permit.nomor,
        workName: member.permit.workName,
        location: member.permit.location,
        vendorName: member.permit.vendor.name,
      }}
      quizzes={quizzes}
      initialQuizResult={
        member.quizResult
          ? {
              score: member.quizResult.score,
              isPassed: member.quizResult.isPassed,
              isCompleted: member.quizResult.isCompleted,
              completedAt: member.quizResult.completedAt?.toISOString() || null,
            }
          : null
      }
      initialCertificate={
        member.certificate
          ? {
              id: member.certificate.id,
              nomor: member.certificate.nomor,
              isValid: member.certificate.isValid,
              expiredAt: member.certificate.expiredAt.toISOString(),
              createdAt: member.certificate.createdAt.toISOString(),
            }
          : null
      }
    />
  );
}
