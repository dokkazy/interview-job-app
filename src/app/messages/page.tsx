/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ChannelList, Channel, MessageInput, MessageList, Thread, Window } from "stream-chat-react"
import { ChatProvider, useChat } from "@/components/sections/chat/chat-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

function MessagesContent() {
  const { user } = useAuth()
  const { client, isLoading } = useChat()
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || !client) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <p className="text-muted-foreground mb-4">Please log in to view your messages.</p>
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  const filters = { type: "messaging", members: { $in: [user.id] } }
  const options = { limit: 10 }

  const customChannelRenderer = (props: any) => {
    const { channel } = props
    return (
      <div
        className={`p-4 border-b cursor-pointer hover:bg-muted ${activeChannel?.cid === channel.cid ? "bg-muted" : ""}`}
        onClick={() => setActiveChannel(channel)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">
              {channel.data.name ||
                Object.values(channel.state.members)
                  .filter((m: any) => m.user?.id !== user.id)
                  .map((m: any) => m.user?.name || "Unknown User")
                  .join(", ")}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {channel.state.messages[channel.state.messages.length - 1]?.text || "No messages yet"}
            </p>
          </div>
          {channel.state.unreadCount > 0 && (
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {channel.state.unreadCount}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault()
              router.back()
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </a>
        </Button>
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="border rounded-lg overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h2 className="font-medium">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-[calc(100%-56px)]">
            <ChannelList filters={filters} options={options} Preview={customChannelRenderer} />
          </div>
        </div>

        <div className="md:col-span-2 border rounded-lg overflow-hidden">
          {activeChannel ? (
            <Channel channel={activeChannel}>
              <Window>
                <div className="p-4 border-b bg-muted/50">
                  <h2 className="font-medium">
                    {activeChannel.data.name ||
                      Object.values(activeChannel.state.members)
                        .filter((m: any) => m.user?.id !== user.id)
                        .map((m: any) => m.user?.name || "Unknown User")
                        .join(", ")}
                  </h2>
                  {activeChannel.data.job_title && (
                    <p className="text-sm text-muted-foreground">Re: {activeChannel.data.job_title}</p>
                  )}
                </div>
                <MessageList />
                <MessageInput focus />
              </Window>
              <Thread />
            </Channel>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <ChatProvider>
      <MessagesContent />
    </ChatProvider>
  )
}
