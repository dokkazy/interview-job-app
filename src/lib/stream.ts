import { StreamChat } from "stream-chat";
import type { User } from "@/lib/types";

// Stream Chat API keys - in a real app, these would be environment variables
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

// Only use the key for the client-side instance
export const streamClient = StreamChat.getInstance(STREAM_API_KEY);
/**
 * Fetches a Stream Chat token for a user from the server-side API
 * @param userId The user's ID
 * @returns A Stream Chat token
 */
export const getStreamToken = async (userId: string): Promise<string> => {
  try {
    const res = await fetch("/api/stream-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      throw new Error("Failed to fetch Stream token");
    }
    const data = await res.json();
    return data.token;
  } catch (error) {
    console.error("Error fetching Stream token:", error);
    throw error;
  }
};

/**
 * Initializes a user in Stream Chat
 * @param user The user object
 * @returns The updated Stream Chat client
 */
export const initializeStreamUser = async (user: User) => {
  try {
    // Fetch a token for the user from the API
    const token = await getStreamToken(user.id);

    // Connect the user to Stream Chat
    await streamClient.connectUser(
      {
        id: user.id,
        name: user.displayName,
        image: user.photoURL || undefined,
        role: user.role,
      },
      token
    );

    return streamClient;
  } catch (error) {
    console.error("Error initializing Stream user:", error);
    throw error;
  }
};

/**
 * Creates or gets a chat channel between a recruiter and a job seeker
 * @param recruiterId The recruiter's user ID
 * @param jobSeekerId The job seeker's user ID
 * @param jobId Optional job ID to associate with the channel
 * @param client Optional StreamChat client instance (from context)
 * @returns The created or existing chat channel
 */
export const createOrGetChatChannel = async (
  recruiterId: string,
  jobSeekerId: string,
  jobId?: string,
  client?: StreamChat
) => {
  const chatClient = client || streamClient;
  try {
    // Create a unique channel ID
    const channelId = [recruiterId, jobSeekerId].sort().join("-");

    // Check if the channel already exists
    const existingChannels = await chatClient.queryChannels({
      id: channelId,
      type: "messaging",
    });

    if (existingChannels.length > 0) {
      return existingChannels[0];
    }

    // Create a new channel
    const channel = chatClient.channel("messaging", channelId, {
      members: [recruiterId, jobSeekerId],
      job_id: jobId || undefined,
    });

    await channel.create();
    return channel;
  } catch (error) {
    console.error("Error creating or getting chat channel:", error);
    throw error;
  }
};

/**
 * Sends a notification message to a user
 * @param senderId The sender's user ID
 * @param receiverId The receiver's user ID
 * @param message The message to send
 * @param jobTitle Optional job title to include in the message
 * @param client Optional StreamChat client instance (from context)
 */
export const sendNotification = async (
  senderId: string,
  receiverId: string,
  message: string,
  jobTitle?: string,
  client?: StreamChat
) => {
  try {
    const channel = await createOrGetChatChannel(
      senderId,
      receiverId,
      undefined,
      client
    );

    await channel.sendMessage({
      text: message,
      is_notification: true,
      job_title: jobTitle,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

/**
 * Disconnects the current user from Stream Chat
 */
export const disconnectUser = async () => {
  try {
    await streamClient.disconnectUser();
  } catch (error) {
    console.error("Error disconnecting user:", error);
  }
};
