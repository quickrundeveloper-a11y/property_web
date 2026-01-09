"use client";

import { useState, useEffect } from "react";
import WhatsAppChatInterface from "./whatsapp-chat-interface";

export default function FloatingSMSWidget() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialContact, setInitialContact] = useState<
    | {
        propertyId: string;
        propertyTitle?: string;
        sellerId: string;
        sellerName?: string;
      }
    | undefined
  >(undefined);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as any;
      if (!detail || !detail.contact) return;

      const contact = detail.contact as any;
      if (contact.propertyId && contact.sellerId) {
        setInitialContact({
          propertyId: contact.propertyId,
          propertyTitle: contact.propertyTitle,
          sellerId: contact.sellerId,
          sellerName: contact.sellerName,
        });
        setInitialMessage(detail.message);
        setIsChatOpen(true);
      }
    };
    window.addEventListener("open-chat", handler as EventListener);
    return () => {
      window.removeEventListener("open-chat", handler as EventListener);
    };
  }, []);

  return (
    <>
      {/* Floating SMS Button */}
      <div className="fixed bottom-20 right-6 z-50">
        <button
          onClick={() => setIsChatOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title="Open chat"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        </button>
      </div>

      {/* WhatsApp-style Chat Interface */}
      <WhatsAppChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        initialContact={initialContact}
        initialMessage={initialMessage}
      />
    </>
  );
}
