/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.NEXT_PUBLIC_STREAM_API_SECRET;

export async function POST(req: NextRequest) {
  try {
    const { id, name, image, role } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return NextResponse.json({ error: 'Stream API credentials not set' }, { status: 500 });
    }
    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
    await serverClient.upsertUser({ id, name, image, role });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 