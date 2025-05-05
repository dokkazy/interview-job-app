"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { doc, getDoc, deleteDoc, doc as firestoreDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Interview } from "@/lib/types"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  StreamVideoClient,
  StreamCall,
  StreamVideo,
  SpeakerLayout,
  useCall,
} from "@stream-io/video-react-sdk"
import { useCallStateHooks } from "@stream-io/video-react-bindings"
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react"

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY!

function InterviewCallControls() {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const micState = useMicrophoneState();
  const camState = useCameraState();

  const handleLeave = async () => {
    await call?.leave();
    window.location.href = "/interviews";
  };

  return (
    <div className="flex gap-4 justify-center py-4">
      <button
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        onClick={() => micState.microphone.toggle()}
        title={micState.isMute ? "Unmute" : "Mute"}
      >
        {micState.isMute ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
      <button
        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300"
        onClick={() => camState.camera.toggle()}
        title={camState.isMute ? "Turn Camera On" : "Turn Camera Off"}
      >
        {camState.isMute ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
      </button>
      <button
        className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
        onClick={handleLeave}
        title="Leave Room"
      >
        <PhoneOff className="w-6 h-6" />
      </button>
    </div>
  );
}

export default function JoinInterviewPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(null)

  // Fetch interview details
  useEffect(() => {
    async function fetchInterview() {
      if (!id) return
      setLoading(true)
      try {
        const interviewDoc = await getDoc(doc(db, "interviews", id as string))
        if (!interviewDoc.exists()) {
          setError("Interview not found.")
          setLoading(false)
          return
        }
        setInterview({ id: interviewDoc.id, ...interviewDoc.data() } as Interview)
      } catch {
        setError("Failed to load interview details.")
      } finally {
        setLoading(false)
      }
    }
    fetchInterview()
  }, [id])

  // Fetch video token
  useEffect(() => {
    async function fetchToken() {
      if (!user) return
      try {
        const res = await fetch("/api/stream-video-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })
        if (!res.ok) throw new Error("Failed to get video token")
        const data = await res.json()
        setToken(data.token)
      } catch {
        setError("Failed to get video token.")
      }
    }
    if (user) fetchToken()
  }, [user])

  // Initialize StreamVideoClient and call
  useEffect(() => {
    if (!token || !user || !interview?.meetingUrl) return
    const client = new StreamVideoClient({
      apiKey: STREAM_API_KEY,
      user: {
        id: user.id,
        name: user.displayName,
        image: user.photoURL || undefined,
      },
      token,
    })
    setClient(client)
    const call = client.call("default", interview.meetingUrl)
    setCall(call)
    return () => {
      client.disconnectUser?.()
    }
  }, [token, user, interview?.meetingUrl])

  // Join call when ready
  useEffect(() => {
    if (!call) return
    call.join().catch(() => setError("Failed to join the call."))
    // Cleanup handled by client disconnect
  }, [call])

  const handleDeleteInterview = async () => {
    if (!interview) return;
    if (!window.confirm("Are you sure you want to delete this interview? This action cannot be undone.")) return;
    try {
      await deleteDoc(firestoreDoc(db, "interviews", interview.id));
      router.push("/interviews");
    } catch {
      alert("Failed to delete interview.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 flex flex-col items-center">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/interviews")}>Back to Interviews</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user || !interview || !client || !call) return null

  return (
    <div className="container mx-auto py-10">
      {user.role === "recruiter" && interview && (
        <div className="mb-4 flex justify-end">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={handleDeleteInterview}
          >
            Delete Interview
          </button>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6">Interview Video Call</h1>
      <div className="w-full max-w-4xl mx-auto">
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <div className="rounded-lg overflow-hidden border shadow-lg bg-background">
              <SpeakerLayout />
              <InterviewCallControls />
            </div>
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  )
}
