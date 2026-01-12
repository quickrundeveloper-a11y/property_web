"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@/app/context/ChatContext";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDoc,
  doc
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Chat {
  id: string;
  chatId: string;
  propertyId: string;
  propertyName: string;
  users: string[];
  userNames: { [key: string]: string };
  lastMessage: string;
  lastSenderId: string;
  lastUpdated: any;
  unreadCounts: { [key: string]: number };
}

interface ChatListProps {
  selectedChatId?: string;
  className?: string;
  onChatSelect?: (chatId: string) => void;
}

export default function ChatList({ selectedChatId, className = "", onChatSelect }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [nameCache, setNameCache] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { openChat } = useChat();

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
    if (!currentUser) return;

    // Use the correct collection path: property_All/main/chats
    const chatsRef = collection(db, "property_All", "main", "chats");
    const q = query(
      chatsRef,
      where("users", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Chat[];
      
      // Sort client-side to avoid needing a composite index
      chatList.sort((a, b) => {
        const timeA = a.lastUpdated?.toDate ? a.lastUpdated.toDate().getTime() : 0;
        const timeB = b.lastUpdated?.toDate ? b.lastUpdated.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const getOtherUserId = (chat: Chat) => {
    return chat.users.find((uid) => uid !== currentUser?.uid) || "";
  };

  const getOtherUserName = (chat: Chat) => {
    const otherId = getOtherUserId(chat);
    return chat.userNames?.[otherId] || "User";
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate background color based on initials
  const getAvatarColor = (initials: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-purple-100 text-purple-600",
      "bg-orange-100 text-orange-600",
      "bg-pink-100 text-pink-600",
      "bg-teal-100 text-teal-600",
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const filteredChats = chats.filter((chat) => {
    const searchLower = searchQuery.toLowerCase();
    const otherName = getOtherUserName(chat).toLowerCase();
    const propName = (chat.propertyName || "").toLowerCase();
    const lastMsg = (chat.lastMessage || "").toLowerCase();
    
    return (
      otherName.includes(searchLower) ||
      propName.includes(searchLower) ||
      lastMsg.includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-full ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-4 ${className}`}>
        <p className="text-gray-600 mb-4 text-center">Please sign in to view your messages.</p>
        <button
          onClick={() => router.push("/auth")}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      <div className="p-5 border-b bg-white">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 tracking-tight">Messages</h1>
        
        {/* Search Bar */}
        <div className="relative group">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-gray-50 group-hover:bg-white transition-all shadow-sm"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 transition-colors group-hover:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium">No messages found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredChats.map((chat) => {
              const otherUserId = getOtherUserId(chat);
              const otherUserName = getOtherUserName(chat);
              const unreadCount = chat.unreadCounts?.[currentUser.uid] || 0;
              const initials = getInitials(otherUserName);
              const isSelected = selectedChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    if (onChatSelect) {
                      onChatSelect(chat.id);
                    } else {
                      openChat(chat.id);
                    }
                  }}
                  className={`p-4 transition-all cursor-pointer flex items-center gap-4 border-l-4 ${
                    isSelected 
                      ? "bg-blue-50 border-blue-600 shadow-sm" 
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${getAvatarColor(initials)}`}>
                    {initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-semibold text-base truncate pr-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {otherUserName}
                      </h3>
                      <span className={`text-[11px] whitespace-nowrap ${unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {formatTime(chat.lastUpdated)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-green-700 font-medium truncate mb-1 bg-green-100 w-fit px-2 py-0.5 rounded-full">
                      {chat.propertyName}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        <span className="text-gray-400 font-normal">{chat.lastSenderId === currentUser.uid ? "You: " : ""}</span>
                        {chat.lastMessage}
                      </p>
                      {unreadCount > 0 && (
                        <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0 min-w-[1.25rem] text-center shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
