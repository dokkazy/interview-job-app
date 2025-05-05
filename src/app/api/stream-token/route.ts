import { NextRequest, NextResponse } from "next/server";
import { StreamChat } from "stream-chat";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const apiSecret = process.env.NEXT_PUBLIC_STREAM_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const serverClient = StreamChat.getInstance(apiKey, apiSecret);
    const token = serverClient.createToken(userId);
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating Stream token:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
