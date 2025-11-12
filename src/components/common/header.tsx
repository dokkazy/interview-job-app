/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "@/components/common/user-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat } from "@/components/sections/chat/chat-provider";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export function Header() {
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const { client } = useChat();

  useEffect(() => {
    if (!user || !client) return;

    const handleEvent = (event: any) => {
      if (event.type === "message.new" && event.message.user.id !== user.id) {
        // Update unread count
        setUnreadCount((prev) => prev + 1);

        // Add to notifications if it's a notification message
        if (event.message.is_notification) {
          setNotifications((prev) => [event.message, ...prev].slice(0, 5));
        }
      }
    };

    // Listen for new messages
    client.on("notification.message.new", handleEvent);

    // Get initial unread count
    const getUnreadCount = async () => {
      try {
        const channels = await client.queryChannels({
          members: { $in: [user.id] },
          type: "messaging",
        });

        const count = channels.reduce(
          (acc, channel) => acc + channel.state.unreadCount,
          0
        );
        setUnreadCount(count);
      } catch (error) {
        console.error("Error getting unread count:", error);
      }
    };

    getUnreadCount();

    return () => {
      client.off("notification.message.new", handleEvent);
    };
  }, [user, client]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleNotificationClick = (notification: any) => {
    router.push("/messages");
    setUnreadCount(0);
  };

  return (
    <header className="border-b">
      <div className="max-w-7xl mx-auto w-full">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold text-2xl">
              JobConnect
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/jobs"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Jobs
              </Link>
              {user?.role === "recruiter" && (
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Post Jobs
                </Link>
              )}
              <Link
                href="/interviews"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Interviews
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-xs">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-2 font-medium border-b">Notifications</div>
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <DropdownMenuItem
                        key={index}
                        className="p-3 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div>
                          <p>{notification.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              notification.created_at
                            ).toLocaleTimeString()}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No new notifications
                    </div>
                  )}
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => router.push("/messages")}
                    >
                      View all messages
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <ThemeToggle />
            {!loading && !user ? (
              <div className="hidden md:flex items-center gap-2">
                <Button asChild variant="ghost">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : (
              !loading && <UserNav user={user} />
            )}
            <MobileNav user={user} />
          </div>
        </div>
      </div>
    </header>
  );
}
