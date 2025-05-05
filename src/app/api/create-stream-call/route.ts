export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createStreamCall } from "@/app/actions/stream.action";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recruiterId, applicantId, scheduledAt, duration, interviewType } = body;
    if (!recruiterId || !applicantId || !scheduledAt || !duration || !interviewType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const callId = await createStreamCall({
      recruiterId,
      applicantId,
      scheduledAt: new Date(scheduledAt),
      duration,
      interviewType,
    });
    return NextResponse.json({ callId });
  } catch (error) {
    console.error("Error creating Stream call:", error);
    return NextResponse.json({ error: "Failed to create Stream call" }, { status: 500 });
  }
} 