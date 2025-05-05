import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import { ChatProvider } from "@/components/sections/chat/chat-provider";
import { Toaster } from "sonner";
import { StreamVideoProvider } from "@/providers/video-provider";
import "@stream-io/video-react-sdk/dist/css/styles.css"

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "JobConnect - Modern Job Portal",
  description: "Connect job seekers with recruiters in real-time",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <StreamVideoProvider>
            <ChatProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 max-w-7xl mx-auto w-full">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </ChatProvider>
          </StreamVideoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
