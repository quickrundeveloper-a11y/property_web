"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: any;
  type: 'sent' | 'received';
  propertyId?: string;
  propertyTitle?: string;
}

interface ChatContact {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  lastMessageTime: any;
  unreadCount: number;
  avatar?: string;
  isOnline?: boolean;
  propertyTitle?: string;
}

export default function WhatsAppChatInterface({
  isOpen,
  onClose,
  initialContact,
  initialMessage
}: {
  isOpen: boolean;
  onClose: () => void;
  initialContact?: { id: string; name: string; phone: string; propertyTitle?: string };
  initialMessage?: string;
}) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Get user ID
  const getUserId = () => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  };

  // Load chat contacts
  const loadContacts = async () => {
    try {
      const userId = getUserId();
      
      // Use a simpler query to get all messages, then filter client-side
      const messagesQuery = query(
        collection(db, "chat_messages"),
        orderBy("timestamp", "desc")
      );
      
      const snapshot = await getDocs(messagesQuery);
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];

      // Filter messages where user is involved
      const userMessages = allMessages.filter(message => 
        message.senderId === userId || message.receiverId === userId
      );

      // Group messages by contact
      const contactsMap = new Map<string, ChatContact>();

      userMessages.forEach(message => {
        const contactId = message.senderId === userId ? message.receiverId : message.senderId;
        const contactPhone = contactId.includes('admin') ? '+91-9876543210' : contactId;
        const contactName = contactId.includes('admin') ? 'Property Support' : `Customer ${contactPhone.slice(-4)}`;

        if (!contactsMap.has(contactId)) {
          contactsMap.set(contactId, {
            id: contactId,
            name: contactName,
            phone: contactPhone,
            lastMessage: message.message,
            lastMessageTime: message.timestamp,
            unreadCount: 0,
            isOnline: Math.random() > 0.5, // Random online status
            propertyTitle: message.propertyTitle
          });
        } else {
          const contact = contactsMap.get(contactId)!;
          if (message.timestamp > contact.lastMessageTime) {
            contact.lastMessage = message.message;
            contact.lastMessageTime = message.timestamp;
          }
        }
      });

      // Add some sample contacts if no messages exist
      if (contactsMap.size === 0) {
        const sampleContacts: ChatContact[] = [
          {
            id: 'admin-support',
            name: 'Property Support',
            phone: '+91-9876543210',
            lastMessage: 'Hello! How can I help you with properties?',
            lastMessageTime: new Date(),
            unreadCount: 1,
            isOnline: true,
            propertyTitle: 'General Support'
          },
          {
            id: 'agent-1',
            name: 'Raj Kumar (Agent)',
            phone: '+91-9876543211',
            lastMessage: 'The property you inquired about is available',
            lastMessageTime: new Date(Date.now() - 3600000),
            unreadCount: 0,
            isOnline: false,
            propertyTitle: 'Amarpali Zodiac'
          },
          {
            id: 'agent-2', 
            name: 'Priya Sharma (Agent)',
            phone: '+91-9876543212',
            lastMessage: 'Would you like to schedule a visit?',
            lastMessageTime: new Date(Date.now() - 7200000),
            unreadCount: 2,
            isOnline: true,
            propertyTitle: 'DLF Cyber City'
          }
        ];
        
        sampleContacts.forEach(contact => contactsMap.set(contact.id, contact));
      }

      const contactsList = Array.from(contactsMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setContacts(contactsList);
      setLoading(false);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setLoading(false);
    }
  };

  // Load messages for selected contact
  const loadMessages = (contactId: string) => {
    const userId = getUserId();
    
    // Use a simpler query to avoid index requirements
    const messagesQuery = query(
      collection(db, "chat_messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      
      // Filter messages for this conversation on the client side
      const conversationMessages = allMessages.filter(message => 
        (message.senderId === userId && message.receiverId === contactId) ||
        (message.senderId === contactId && message.receiverId === userId)
      ).map(message => ({
        ...message,
        type: message.senderId === userId ? 'sent' : 'received'
      })) as ChatMessage[];
      
      setMessages(conversationMessages);
    });

    return unsubscribe;
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const userId = getUserId();
      
      await addDoc(collection(db, "chat_messages"), {
        senderId: userId,
        receiverId: selectedContact.id,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        propertyId: selectedContact.propertyTitle ? 'sample-property' : null,
        propertyTitle: selectedContact.propertyTitle || null
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Format time
  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      if (diff < 86400000) { // Less than 24 hours
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (diff < 604800000) { // Less than 7 days
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch {
      return "";
    }
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.propertyTitle && contact.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !initialContact) return;
    const contact: ChatContact = {
      id: initialContact.id,
      name: initialContact.name,
      phone: initialContact.phone,
      lastMessage: "",
      lastMessageTime: new Date(),
      unreadCount: 0,
      isOnline: true,
      propertyTitle: initialContact.propertyTitle
    };
    setSelectedContact(contact);
    setContacts(prev => {
      const exists = prev.some(c => c.id === contact.id);
      return exists ? prev : [contact, ...prev];
    });
    if (initialMessage) {
      setNewMessage(initialMessage);
    }
  }, [isOpen, initialContact, initialMessage]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (selectedContact) {
      unsubscribe = loadMessages(selectedContact.id);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [selectedContact]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden border border-gray-200">
        {/* Left Sidebar - Contacts List */}
        <div className="w-full sm:w-1/3 bg-gradient-to-b from-blue-50 to-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-400/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-blue-300/20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-lg">My Chats</h2>
                <p className="text-xs text-blue-100">{contacts.length} conversations</p>
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

          {/* Search */}
          <div className="p-4 bg-white border-b border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 text-black"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto bg-white">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading chats...</p>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">No conversations found</p>
                <p className="text-gray-400 text-xs mt-1">Start a new chat</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${
                    selectedContact?.id === contact.id ? 'bg-blue-100 border-l-4 border-l-blue-600 shadow-sm' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      {contact.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">{contact.name}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{formatTime(contact.lastMessageTime)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                        {contact.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center font-medium">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                      {contact.propertyTitle && (
                        <p className="text-xs text-blue-600 mb-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {contact.propertyTitle}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side - Chat Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-11 h-11 bg-blue-400/30 backdrop-blur-sm rounded-full flex items-center justify-center font-bold text-lg shadow-md border border-blue-300/20">
                      {selectedContact.name.charAt(0).toUpperCase()}
                    </div>
                    {selectedContact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{selectedContact.name}</h3>
                    <p className="text-xs text-blue-100 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${selectedContact.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                      {selectedContact.isOnline ? 'Online' : 'Last seen recently'} • {selectedContact.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`tel:${selectedContact.phone}`}
                    className="p-2 hover:bg-blue-500/30 rounded-full transition-colors shadow-sm"
                    title="Call"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{backgroundImage: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"chat-bg\" x=\"0\" y=\"0\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1\" fill=\"%23f0f0f0\" opacity=\"0.3\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23chat-bg)\"/></svg>')"}}>
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Start a conversation</p>
                    <p className="text-gray-500 text-sm mt-1">Chat with {selectedContact.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                            message.type === 'sent'
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.message}</p>
                          <p className={`text-xs mt-2 ${
                            message.type === 'sent' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.timestamp)}
                            {message.type === 'sent' && (
                              <svg className="w-4 h-4 inline ml-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t border-gray-200 shadow-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
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
            /* No Chat Selected */
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Property Chat</h3>
                <p className="text-gray-600 text-lg">Select a conversation to start chatting</p>
                <p className="text-gray-500 text-sm mt-2">Connect with your property agents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
