"use client"

import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import type { User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface UserNavProps {
  user: User | null
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter()
  const { setAuthCookies } = useAuth()

  if (!user) return null

  const handleSignOut = async () => {
    try {
      await signOut(auth)

      // Clear auth cookies
      setAuthCookies(null)

      toast.success("Signed out successfully")
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("There was a problem signing out. Please try again later.")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
          {user.role === "recruiter" && (
            <DropdownMenuItem onClick={() => router.push("/dashboard")}>Manage Jobs</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => router.push("/messages")}>Messages</DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/interviews")}>Interviews</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
