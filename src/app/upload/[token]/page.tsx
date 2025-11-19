import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GuestUploadWizard } from "@/components/upload/GuestUploadWizard";

interface GuestUploadPageProps {
  params: {
    token: string;
  };
}

export default async function GuestUploadPage({
  params,
}: GuestUploadPageProps) {
  const { token } = params;

  const uploadToken = await db.externalUploadToken.findUnique({
    where: { token },
    include: {
      intakeSession: {
        include: {
          claimant: true,
        },
      },
    },
  });

  if (!uploadToken) {
    return notFound();
  }

  if (uploadToken.expiresAt < new Date()) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Link Expired</CardTitle>
            <CardDescription className="text-red-600">
              This upload link has expired. Please request a new one from the
              claimant.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const claimantName = `${uploadToken.intakeSession.claimant?.firstName} ${uploadToken.intakeSession.claimant?.lastName}`;
  const recipientName = uploadToken.recipientName || "Guest";

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-sage-900">RadiantClaims</h1>
          <p className="text-sage-600">Secure Document Upload</p>
        </div>

        <GuestUploadWizard
          uploadToken={uploadToken}
          claimantName={claimantName}
          recipientName={recipientName}
        />
      </div>
    </div>
  );
}
