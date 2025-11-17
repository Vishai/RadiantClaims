import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TutorialManager } from "@/lib/tutorials";

interface Params {
  params: {
    id: string;
  };
}

const manager = new TutorialManager({ autoSync: false });

export async function POST(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await manager.completeTutorial(session.user.id, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tutorials:complete] failed", error);
    return NextResponse.json(
      { error: "Failed to complete tutorial" },
      { status: 500 }
    );
  }
}
