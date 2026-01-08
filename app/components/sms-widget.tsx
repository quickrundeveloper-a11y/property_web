"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  limit,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface SMSMessage {
  id: string;
  message: string;
  phoneNumber: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  timestamp: any;
  userId: string;
  status: 'pending' | 'sent' | 'failed';
  type: 'sms' | 'whatsapp';
  isRead?: boolean;
}

export default function SMSWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp'>('sms');
  const [loading, setLoading] = useState(false);

  // Load SMS messages for current user
  useEffect(() => {
    if (!user) return;

    const smsQuery = query(
      collection(db, "sms"),
      where("userId", "==", user.uid),
      limit(50)
    );

    const unsubscribe = onSnapshot(smsQuery, (snapshot) => {
      const messageList: SMSMessage[] = [];
      
      snapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() } as SMSMessage;
        messageList.push(messageData);
      });
      
      // Sort messages by timestamp on client side (newest first)
      messageList.sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        const aTime = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const bTime = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime(); // Newest first
      });
      
      setSmsMessages(messageList);
    });

    return () => unsubscribe();
  }, [user]);

  const sendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !phoneNumber.trim() || !user || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "sms"), {
        message: newMessage.trim(),
        phoneNumber: phoneNumber.trim(),
        senderId: user.uid,
        senderEmail: user.email,
        senderName: user.displayName || user.email?.split("@")[0] || "User",
        userId: user.uid,
        timestamp: serverTimestamp(),
        status: 'pending',
        type: messageType,
        isRead: false,
      });

      setNewMessage("");
      setPhoneNumber("");
      alert(`${messageType.toUpperCase()} message queued for sending!`);
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Error sending message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  if (!user) return null;

  return (
    <>
      {/* SMS Icon - Fixed to Right Side */}
      <div className="fixed right-20 bottom-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 relative"
          title="Send SMS/WhatsApp"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21l4-4 4 4M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
          </svg>
        </button>
      </div>

      {/* SMS Widget - Positioned on Right Side */}
      {isOpen && (
        <div className="fixed right-20 bottom-20 z-50 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Widget Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold text-sm">SMS/WhatsApp</h3>
                  <p className="text-xs text-green-100">Send messages to clients</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message Type Selector */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex space-x-2">
              <button
                onClick={() => setMessageType('sms')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  messageType === 'sms' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📱 SMS
              </button>
              <button
                onClick={() => setMessageType('whatsapp')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  messageType === 'whatsapp' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>

          {/* Messages History */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {smsMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-xs">No messages sent yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Send SMS/WhatsApp to your clients
                </p>
              </div>
            ) : (
              smsMessages.slice(-5).map((message) => (
                <div key={message.id} className="bg-white p-3 rounded-lg border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">
                      {message.type.toUpperCase()}: {message.phoneNumber}
                    </span>
                    <span className={`text-xs ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)} {message.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-1">{message.message}</p>
                  <p className="text-gray-400 text-xs">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
            <form onSubmit={sendSMS} className="space-y-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone number (e.g., +91XXXXXXXXXX)"
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={loading}
                required
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Type ${messageType} message...`}
                  className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                  maxLength={160}
                  required
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || !phoneNumber.trim() || loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors duration-200 text-xs"
                >
                  {loading ? "..." : "Send"}
                </button>
              </div>
            </form>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {newMessage.length}/160 • {messageType.toUpperCase()}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
