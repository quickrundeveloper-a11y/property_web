import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "./conditional-layout";
import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/app/context/ChatContext";
import ChatModal from "@/app/components/chat/ChatModal";
import FloatingChatButton from "@/app/components/chat/FloatingChatButton";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hommie - Property Management Platform",
  description: "Find, rent, buy, and manage properties with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lexend.variable} font-lexend antialiased`}
      >
        <AuthProvider>
          <ChatProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <ChatModal />
            <FloatingChatButton />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
