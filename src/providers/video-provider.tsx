"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth-provider";
import { StreamVideoClient, StreamVideoProvider as SDKStreamVideoProvider } from "@stream-io/video-react-sdk";
import { LoadingSpinner } from "@/components/loading-spinner";

interface VideoProviderProps {
  children: React.ReactNode;
}

export const StreamVideoProvider = ({ children }: VideoProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = useCallback(async (userId: string) => {
    const res = await fetch("/api/stream-video-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to fetch Stream Video token");
    const data = await res.json();
    return data.token;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setClient(null);
      return;
    }
    let videoClient: StreamVideoClient | null = null;
    let didCancel = false;
    setLoading(true);
    (async () => {
      try {
        const token = await fetchToken(user.id);
        videoClient = new StreamVideoClient(
          process.env.NEXT_PUBLIC_STREAM_API_KEY!,
          token
        );
        await videoClient.connectUser(
          {
            id: user.id,
            name: user.displayName,
            image: user.photoURL || undefined,
            // add other user fields as needed
          },
          token
        );
        if (!didCancel) setClient(videoClient);
      } catch (error) {
        console.error("Failed to initialize Stream Video client:", error);
      } finally {
        if (!didCancel) setLoading(false);
      }
    })();
    return () => {
      didCancel = true;
      if (videoClient) videoClient.disconnectUser();
    };
  }, [user, authLoading, fetchToken]);

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }
  if (!user || !client) {
    return <>{children}</>;
  }
  return <SDKStreamVideoProvider client={client}>{children}</SDKStreamVideoProvider>;
}; 