"use client";

import { useAuth } from "@/lib/auth-context";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";

interface ChatThread {
  id: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCountByBuyer?: number;
  unreadCountBySeller?: number;
  buyerName?: string | null;
  sellerName?: string | null;
  propertyTitle?: string | null;
}

interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: any;
  seen: boolean;
}

type InitialChat = {
  propertyId: string;
  propertyTitle?: string;
  sellerId: string;
  sellerName?: string;
  buyerId?: string;
  buyerName?: string;
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return "";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 86400000) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    if (diff < 604800000) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
};

export default function WhatsAppChatInterface({
  isOpen,
  onClose,
  initialContact,
  initialMessage,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialContact?: InitialChat;
  initialMessage?: string;
}) {
  const { user } = useAuth();
  const currentUserId = user?.uid || auth.currentUser?.uid || null;
  const currentUserName = useMemo(() => {
    const name = (user?.displayName || "").trim();
    if (name) return name;
    const email = (user?.email || "").trim();
    if (!email) return null;
    return email.split("@")[0] || null;
  }, [user?.displayName, user?.email]);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [oldestCursor, setOldestCursor] = useState<any | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const suppressAutoScrollRef = useRef(false);

  const getChatId = (propertyId: string, buyerId: string, sellerId: string) => {
    return `${propertyId}_${buyerId}_${sellerId}`;
  };

  const getOtherName = (t: ChatThread) => {
    if (!currentUserId) return "User";
    const isBuyer = t.buyerId === currentUserId;
    const other = isBuyer ? t.sellerName : t.buyerName;
    return (other || "User").toString();
  };

  const getUnreadCount = (t: ChatThread) => {
    if (!currentUserId) return 0;
    if (t.buyerId === currentUserId) return t.unreadCountByBuyer || 0;
    return t.unreadCountBySeller || 0;
  };

  const ensureSignedIn = async () => {
    if (auth.currentUser) return;
    await signInAnonymously(auth);
  };

  const createChatIfMissing = async (args: {
    propertyId: string;
    propertyTitle?: string;
    buyerId: string;
    buyerName?: string | null;
    sellerId: string;
    sellerName?: string | null;
  }) => {
    const chatId = getChatId(args.propertyId, args.buyerId, args.sellerId);
    const chatRef = doc(db, "chats", chatId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(chatRef);
      if (snap.exists()) return;
      tx.set(chatRef, {
        propertyId: args.propertyId,
        propertyTitle: args.propertyTitle || null,
        buyerId: args.buyerId,
        buyerName: args.buyerName || null,
        sellerId: args.sellerId,
        sellerName: args.sellerName || null,
        participants: [args.buyerId, args.sellerId],
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        unreadCountByBuyer: 0,
        unreadCountBySeller: 0,
      });
    });
    return chatId;
  };

  const markThreadSeen = async (thread: ChatThread) => {
    if (!currentUserId) return;
    const chatRef = doc(db, "chats", thread.id);
    const batch = writeBatch(db);
    const messagesRef = collection(db, "chats", thread.id, "messages");
    const unseenQuery = query(messagesRef, where("receiverId", "==", currentUserId), where("seen", "==", false), limit(200));
    const snap = await getDocs(unseenQuery);
    snap.docs.forEach((d) => batch.update(d.ref, { seen: true }));
    const unreadField = thread.buyerId === currentUserId ? "unreadCountByBuyer" : "unreadCountBySeller";
    batch.update(chatRef, { [unreadField]: 0 });
    await batch.commit();
  };

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const other = getOtherName(t).toLowerCase();
      const propertyTitle = (t.propertyTitle || "").toString().toLowerCase();
      const lastMessage = (t.lastMessage || "").toString().toLowerCase();
      return other.includes(q) || propertyTitle.includes(q) || lastMessage.includes(q);
    });
  }, [threads, searchQuery, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread || !currentUserId) return;
    const receiverId = selectedThread.buyerId === currentUserId ? selectedThread.sellerId : selectedThread.buyerId;
    const unreadField = receiverId === selectedThread.buyerId ? "unreadCountByBuyer" : "unreadCountBySeller";
    const text = newMessage.trim();
    setNewMessage("");

    await addDoc(collection(db, "chats", selectedThread.id, "messages"), {
      text,
      senderId: currentUserId,
      receiverId,
      timestamp: serverTimestamp(),
      seen: false,
    });

    await updateDoc(doc(db, "chats", selectedThread.id), {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [unreadField]: increment(1),
    });
  };

  const loadOlder = async () => {
    if (!selectedThread || !hasMoreOlder || isLoadingOlder) return;
    if (!oldestCursor) return;
    setIsLoadingOlder(true);
    suppressAutoScrollRef.current = true;
    try {
      const messagesRef = collection(db, "chats", selectedThread.id, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"), startAfter(oldestCursor), limit(20));
      const snap = await getDocs(q);
      if (snap.empty) {
        setHasMoreOlder(false);
        return;
      }
      const page = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })) as ChatMessage[];
      const normalized = page.map((m) => ({ ...m, seen: !!m.seen }));
      const asc = [...normalized].reverse();
      setMessages((prev) => [...asc, ...prev]);
      setOldestCursor(snap.docs[snap.docs.length - 1]);
      if (snap.docs.length < 20) setHasMoreOlder(false);
    } finally {
      setIsLoadingOlder(false);
      setTimeout(() => {
        suppressAutoScrollRef.current = false;
      }, 0);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    ensureSignedIn()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(chatsRef, where("participants", "array-contains", currentUserId), orderBy("lastMessageTime", "desc"));
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatThread, "id">) })) as ChatThread[];
        setThreads(list);
        if (selectedThread) {
          const next = list.find((t) => t.id === selectedThread.id) || null;
          if (next) setSelectedThread(next);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [isOpen, currentUserId]);

  useEffect(() => {
    if (!isOpen || !initialContact) return;
    if (!currentUserId) return;

    const buyerId = initialContact.buyerId || currentUserId;
    const sellerId = initialContact.sellerId;
    if (!sellerId || buyerId === sellerId) return;

    createChatIfMissing({
      propertyId: initialContact.propertyId,
      propertyTitle: initialContact.propertyTitle,
      buyerId,
      buyerName: initialContact.buyerName || currentUserName,
      sellerId,
      sellerName: initialContact.sellerName || null,
    })
      .then((chatId) => {
        const existing = threads.find((t) => t.id === chatId);
        if (existing) setSelectedThread(existing);
      })
      .catch(() => {});

    if (initialMessage) setNewMessage(initialMessage);
  }, [isOpen, initialContact, initialMessage, currentUserId, currentUserName, threads]);

  useEffect(() => {
    if (!selectedThread || !currentUserId) return;
    setMessages([]);
    setOldestCursor(null);
    setHasMoreOlder(true);

    const messagesRef = collection(db, "chats", selectedThread.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(20));
    const unsubscribe = onSnapshot(q, (snap) => {
      const page = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, "id">) })) as ChatMessage[];
      const normalized = page.map((m) => ({ ...m, seen: !!m.seen }));
      setMessages([...normalized].reverse());
      setOldestCursor(snap.docs[snap.docs.length - 1] || null);
      if (snap.docs.length < 20) setHasMoreOlder(false);
    });
    markThreadSeen(selectedThread).catch(() => {});
    return () => unsubscribe();
  }, [selectedThread?.id, currentUserId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!selectedThread) return;
    if (suppressAutoScrollRef.current) return;
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedThread?.id, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden border border-gray-200">
        <div className="w-full sm:w-1/3 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 flex flex-col">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-400/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-blue-300/20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-lg">My Chats</h2>
                <p className="text-xs text-blue-100">{threads.length} conversations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition-colors p-2 hover:bg-blue-500/30 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 bg-white border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 text-black"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading chats...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No conversations found</p>
                <p className="text-gray-400 text-xs mt-1">Start a new chat from a property</p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                    selectedThread?.id === thread.id ? "bg-blue-100 border-l-4 border-l-blue-600 shadow-sm" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {getOtherName(thread).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">{getOtherName(thread)}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{formatTime(thread.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-600 truncate">{thread.lastMessage || ""}</p>
                        {getUnreadCount(thread) > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {getUnreadCount(thread)}
                          </span>
                        )}
                      </div>
                      {thread.propertyTitle && (
                        <p className="text-xs text-blue-600 mb-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {thread.propertyTitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
          {selectedThread ? (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 bg-blue-400/30 backdrop-blur-sm rounded-full flex items-center justify-center font-bold text-lg shadow-md border border-blue-300/20">
                    {getOtherName(selectedThread).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{getOtherName(selectedThread)}</h3>
                    <p className="text-xs text-blue-100">{selectedThread.propertyTitle || ""}</p>
                  </div>
                </div>
                <div />
              </div>

              <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                style={{
                  backgroundImage:
                    "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"chat-bg\" x=\"0\" y=\"0\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23chat-bg)\"/></svg>')",
                }}
              >
                {hasMoreOlder && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadOlder}
                      disabled={isLoadingOlder}
                      className="text-xs bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1 rounded-full text-gray-700"
                    >
                      {isLoadingOlder ? "Loading..." : "Load older"}
                    </button>
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Start a conversation</p>
                    <p className="text-gray-500 text-sm mt-1">Chat about {selectedThread.propertyTitle || "this property"}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isMine = message.senderId === currentUserId;
                      return (
                        <div key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                              isMine ? "bg-blue-600 text-white rounded-br-md" : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.text}</p>
                            <p className={`text-xs mt-2 ${isMine ? "text-blue-100" : "text-gray-500"}`}>
                              {formatTime(message.timestamp)}
                              {isMine && (
                                <span className="ml-2">{message.seen ? "Seen" : "Sent"}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-black"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-full transition-colors shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Property Chat</h3>
                <p className="text-gray-600 text-lg">Select a conversation to start chatting</p>
                <p className="text-gray-500 text-sm mt-2">Chat is saved in real time</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
