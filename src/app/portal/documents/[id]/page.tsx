import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentDetailView } from "@/components/documents/DocumentDetailView";

interface DocumentPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch document with all related data
  const document = await db.uploadedFile.findUnique({
    where: {
      id: params.id,
    },
    include: {
      intakeSession: {
        select: {
          id: true,
          claimant: {
            select: {
              userId: true,
            },
          },
        },
      },
      tags: {
        select: {
          tag: true,
          confidence: true,
        },
      },
    },
  });

  // Check if document exists and belongs to user
  if (!document || document.intakeSession.claimant?.userId !== session.user.id) {
    notFound();
  }

  return <DocumentDetailView document={document} />;
}
