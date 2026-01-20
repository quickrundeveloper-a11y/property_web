import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});
import ConditionalLayout from "./conditional-layout";
import { AuthProvider } from "@/lib/auth-context";
import { ChatProvider } from "@/app/context/ChatContext";
import ChatModal from "@/app/components/chat/ChatModal";
import FloatingChatButton from "@/app/components/chat/FloatingChatButton";

export const metadata: Metadata = {
  title: "Prime Nivaas: Buy, Sell & Rent Plots, Homes or Villas",
  description:
    "Looking for the best property? Prime Nivaas helps you buy, sell, or rent premium plots, homes, and villas effortlessly. Find your dream property today!",
  keywords:
    "real estate, buy plots, luxury villas for sale, homes for rent, sell property, prime nivaas, residential land, rental houses, property listings, investment plots",
  verification: {
    google: "qBe16FRPwxEAzJtxNw-JaEp-3Ixz_JaTH26PORx9DPM",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lexend.variable} antialiased font-sans`} suppressHydrationWarning>
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
