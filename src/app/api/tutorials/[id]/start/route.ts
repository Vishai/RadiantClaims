import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tutorialEngine } from "@/lib/tutorials";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await tutorialEngine.bootstrap();
  try {
    await tutorialEngine.handleManualLaunch(session.user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tutorials:start] failed", error);
    return NextResponse.json(
      { error: "Failed to start tutorial" },
      { status: 500 }
    );
  }
}
