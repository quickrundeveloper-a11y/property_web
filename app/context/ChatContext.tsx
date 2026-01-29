"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isChatOpen: boolean;
  targetChatId: string | null;
  openChat: (chatId?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);

  const openChat = (chatId?: string) => {
    if (chatId) setTargetChatId(chatId);
    setIsChatOpen(true);
  };
  const closeChat = () => {
    setIsChatOpen(false);
    setTargetChatId(null);
  };
  const toggleChat = () => setIsChatOpen((prev) => !prev);

  return (
    <ChatContext.Provider value={{ isChatOpen, targetChatId, openChat, closeChat, toggleChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
