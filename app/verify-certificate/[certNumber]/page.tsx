import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certNumber: string }>;
}) {
  const { certNumber } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { nomor: certNumber },
    include: {
      member: true,
    },
  });

  if (!cert || !cert.member) {
    notFound();
  }

  redirect(`/induction/${cert.member.permitId}/${cert.member.id}`);
}
