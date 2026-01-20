"use client";

import { useChat } from "@/app/context/ChatContext";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function FloatingChatButton() {
  const { openChat } = useChat();
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (!user || user.isAnonymous) {
      router.push("/auth?fromContact=true");
      return;
    }
    openChat();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-40 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-105 transition-all duration-200 flex items-center justify-center group"
      aria-label="Open Chat"
    >
      <svg 
        className="w-8 h-8" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
        />
      </svg>
      <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Messages
      </span>
    </button>
  );
}
