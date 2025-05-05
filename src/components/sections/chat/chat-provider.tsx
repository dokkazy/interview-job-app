"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { StreamChat } from "stream-chat"
import { Chat } from "stream-chat-react"
import { useAuth } from "@/hooks/use-auth"
import { getStreamToken } from "@/lib/stream"
import { LoadingSpinner } from "@/components/loading-spinner"

// Import Stream Chat CSS
import "stream-chat-react/dist/css/v2/index.css"

interface ChatContextType {
  client: StreamChat | null
  isLoading: boolean
}

const ChatContext = createContext<ChatContextType>({
  client: null,
  isLoading: true,
})

export const useChat = () => useContext(ChatContext)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [client, setClient] = useState<StreamChat | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let chatClient: StreamChat | null = null
    let didCancel = false

    async function init() {
      if (!user) {
        setClient(null)
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      chatClient = StreamChat.getInstance(process.env.STREAM_API_KEY!)
      const token = await getStreamToken(user.id)
      await chatClient.connectUser(
        {
          id: user.id,
          name: user.displayName,
          image: user.photoURL || undefined,
          role: user.role,
        },
        token
      )
      if (!didCancel) {
        setClient(chatClient)
        setIsLoading(false)
      }
    }

    init()

    return () => {
      didCancel = true
      if (chatClient) {
        chatClient.disconnectUser()
      }
      setClient(null)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    )
  }

  if (!client || !user) {
    return <>{children}</>
  }

  return (
    <ChatContext.Provider value={{ client, isLoading }}>
      <Chat client={client} theme="messaging light">
        {children}
      </Chat>
    </ChatContext.Provider>
  )
}
