"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/app/context/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function ChatModal() {
  const { isChatOpen, closeChat, targetChatId } = useChat();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync with targetChatId
  useEffect(() => {
    if (targetChatId) {
      setActiveChatId(targetChatId);
    }
  }, [targetChatId]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeChat]);

  if (!isChatOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={closeChat}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={closeChat}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-800 transition-colors shadow-sm backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-1 h-full overflow-hidden">
          {/* Chat List - Hidden on mobile if chat is active */}
          <div className={`${activeChatId ? 'hidden md:block' : 'block'} w-full md:w-1/3 border-r border-gray-200 h-full bg-white`}>
            <ChatList 
              selectedChatId={activeChatId || undefined} 
              onChatSelect={(id) => setActiveChatId(id)}
              className="h-full"
            />
          </div>

          {/* Chat Window - Hidden on mobile if no chat active */}
          <div className={`${!activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 h-full flex-col bg-gray-50 relative`}>
            {activeChatId ? (
              <>
                {/* Mobile Back Button Overlay */}
                <div className="md:hidden absolute top-4 left-4 z-40">
                  <button 
                    onClick={() => setActiveChatId(null)}
                    className="p-2 bg-white/90 rounded-full text-gray-600 shadow-sm hover:bg-white transition-colors backdrop-blur-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>
                <ChatWindow 
                  chatId={activeChatId} 
                  className="h-full" 
                  onBack={() => setActiveChatId(null)}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a conversation</h3>
                <p className="max-w-xs mx-auto">Choose a chat from the list to start messaging with property owners and buyers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
