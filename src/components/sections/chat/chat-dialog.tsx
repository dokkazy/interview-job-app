/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Channel, MessageInput, MessageList, Thread, Window } from "stream-chat-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useChat } from "@/components/sections/chat/chat-provider"
import { createOrGetChatChannel } from "@/lib/stream"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from "@/lib/types"

interface ChatDialogProps {
  isOpen: boolean
  onClose: () => void
  otherUser: User
  jobId?: string
  jobTitle?: string
}

export function ChatDialog({ isOpen, onClose, otherUser, jobId, jobTitle }: ChatDialogProps) {
  const { client } = useChat()
  const [channel, setChannel] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeChannel = async () => {
      if (!client || !otherUser || !isOpen) return

      try {
        setLoading(true)
        const chatChannel = await createOrGetChatChannel(client.userID!, otherUser.id, jobId, client)
        setChannel(chatChannel)
      } catch (error) {
        console.error("Error initializing chat channel:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeChannel()
  }, [client, otherUser, isOpen, jobId])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={otherUser?.photoURL || undefined} />
              <AvatarFallback>{otherUser ? getInitials(otherUser.displayName) : "?"}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{otherUser?.displayName}</DialogTitle>
              {jobTitle && <p className="text-sm text-muted-foreground">Re: {jobTitle}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <LoadingSpinner />
          </div>
        ) : channel ? (
          <div className="h-[500px]">
            <Channel channel={channel}>
              <Window>
                <MessageList />
                <MessageInput focus />
              </Window>
              <Thread />
            </Channel>
          </div>
        ) : (
          <div className="flex justify-center items-center h-[400px]">
            <p>Could not load chat. Please try again.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
