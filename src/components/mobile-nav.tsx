"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import type { User } from "@/lib/types"

interface MobileNavProps {
  user: User | null
}

export function MobileNav({ user }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col gap-4 mt-8">
          <Link
            href="/jobs"
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setOpen(false)}
          >
            Jobs
          </Link>

          {user?.role === "recruiter" && (
            <Link
              href="/dashboard"
              className="text-lg font-medium hover:text-primary transition-colors"
              onClick={() => setOpen(false)}
            >
              Post Jobs
            </Link>
          )}

          <Link
            href="/about"
            className="text-lg font-medium hover:text-primary transition-colors"
            onClick={() => setOpen(false)}
          >
            About
          </Link>

          {!user ? (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full">
                  Log in
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full">Sign up</Button>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/messages"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Messages
              </Link>
              <Link
                href="/interviews"
                className="text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                Interviews
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
