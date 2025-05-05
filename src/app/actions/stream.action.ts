import { StreamClient } from "@stream-io/node-sdk";
import { v4 as uuidv4 } from "uuid";
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;
const STREAM_API_SECRET = process.env.NEXT_PUBLIC_STREAM_API_SECRET!;

export const tokenProvider = async (user_id: string) => {
  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;
  return streamClient.generateUserToken({
    user_id,
    exp: expirationTime,
    validity_in_seconds: issuedAt,
  });
};

export const createStreamCall = async ({ recruiterId, applicantId, scheduledAt, duration, interviewType }: {
  recruiterId: string;
  applicantId: string;
  scheduledAt: Date;
  duration: number;
  interviewType: string;
}) => {
  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  const callId = uuidv4();
  await streamClient.video.call("default", callId).create({
    data: {
      created_by_id: recruiterId,
      members: [
        { user_id: recruiterId, role: "admin" },
        { user_id: applicantId }
      ],
      starts_at: scheduledAt,
      custom: {
        duration,
        interviewType,
      },
    },
  });
  return callId;
};