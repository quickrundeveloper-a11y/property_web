"use client";

import { useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
import { 
  doc, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  increment,
  setDoc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface ChatData {
  users: string[];
  userNames: { [key: string]: string };
  propertyName: string;
  unreadCounts: { [key: string]: number };
  sellerName?: string;
  buyerName?: string;
  OwnerName?: string;
  contactName?: string;
}

interface ChatWindowProps {
  chatId: string;
  className?: string;
  onBack?: () => void;
}

export default function ChatWindow({ chatId, className = "", onBack }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser || !chatId) return;

    // Listen to chat metadata at correct path: property_All/main/chats
    const chatRef = doc(db, "property_All", "main", "chats", chatId);
    const unsubscribeChat = onSnapshot(chatRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as ChatData;
        setChatData(data);
        
        // Reset unread count if needed
        if (data.unreadCounts?.[currentUser.uid] > 0) {
          updateDoc(chatRef, {
            [`unreadCounts.${currentUser.uid}`]: 0
          });
        }
      }
    });

    // Listen to messages
    const messagesRef = collection(db, "property_All", "main", "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    
    const unsubscribeMessages = onSnapshot(q, (snapshot) => {
      const msgList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgList);
      setLoading(false);
    });

    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };
  }, [currentUser, chatId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear input immediately

    // Derive otherUserId from chatData if available, otherwise try to parse from chatId or ignore
    let otherUserId = null;
    let senderName = "User";

    if (chatData) {
        otherUserId = chatData.users.find(uid => uid !== currentUser.uid);
        senderName = chatData.userNames[currentUser.uid] || "User";
    } else {
        // Fallback: Try to get sender name from auth profile
        senderName = currentUser.displayName || "User";
    }

    try {
      // 1. Add message to subcollection in property_All/main/chats
      await addDoc(collection(db, "property_All", "main", "chats", chatId, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        senderName: senderName,
        createdAt: serverTimestamp()
      });

      // 2. Update chat document in property_All/main/chats
      const chatRef = doc(db, "property_All", "main", "chats", chatId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        lastMessage: messageText,
        lastSenderId: currentUser.uid,
        lastUpdated: serverTimestamp(),
      };

      if (otherUserId) {
        updateData[`unreadCounts.${otherUserId}`] = increment(1);
      }

      // Try update first, fallback to setDoc (merge) if fails
      try {
        await updateDoc(chatRef, updateData);
      } catch (err) {
        console.warn("Chat doc update failed, trying setDoc...", err);
        await setDoc(chatRef, updateData, { merge: true });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please check your connection.");
    }
  };

  const getOtherUserName = () => {
    if (!chatData || !currentUser) return "Chat";
    const otherId = chatData.users?.find((uid) => uid !== currentUser.uid);
    const fromMap = otherId ? chatData.userNames?.[otherId] : "";
    const fallback =
      chatData.sellerName ||
      chatData.buyerName ||
      chatData.OwnerName ||
      chatData.contactName;
    return fromMap || fallback || "Chat";
  };

  const formatTime = (timestamp: { seconds: number; nanoseconds: number } | null) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 shadow-md flex items-center gap-4 z-10">
        <button 
          onClick={() => {
            if (onBack) {
              onBack();
            }
          }}
          className={`md:hidden p-2 hover:bg-white/10 rounded-full text-white transition-colors ${!onBack ? 'hidden' : ''}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="font-bold text-white text-lg">{getOtherUserName()}</h2>
          <p className="text-xs text-blue-100 font-medium">{chatData?.propertyName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div 
              key={msg.id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-5 py-3 shadow-md ${
                  isMe 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl rounded-br-sm' 
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <form onSubmit={sendMessage} className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-5 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-3 rounded-full hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
          >
            <svg className="w-6 h-6 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
