"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, updateDoc, deleteDoc, query, orderBy, onSnapshot } from "firebase/firestore";

interface Message {
  id: string;
  name: string;
  phone: string;
  message: string;
  timestamp: any;
  status: 'read' | 'unread';
  type: string;
  source: string;
}

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    // Real-time listener for messages
    const q = query(collection(db, "property_All", "main", "messages"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      
      setMessages(messagesData);
      setLoading(false);
      console.log("Messages loaded:", messagesData.length);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        status: 'read'
      });
      console.log("Message marked as read:", messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const markAsUnread = async (messageId: string) => {
    try {
      await updateDoc(doc(db, "messages", messageId), {
        status: 'unread'
      });
      console.log("Message marked as unread:", messageId);
    } catch (error) {
      console.error("Error marking message as unread:", error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteDoc(doc(db, "property_All", "main", "messages", messageId));
        console.log("Message deleted:", messageId);
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };

  const filteredMessages = messages.filter(message => {
    if (filter === 'all') return true;
    return message.status === filter;
  });

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Unknown time";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'unread' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Messages Management</h1>
                <p className="text-blue-100 mt-1">Manage customer inquiries and messages</p>
              </div>
              <div className="bg-blue-500/30 px-4 py-2 rounded-lg">
                <span className="text-lg font-semibold">{messages.length} Total Messages</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({messages.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Unread ({messages.filter(m => m.status === 'unread').length})
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'read'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Read ({messages.filter(m => m.status === 'read').length})
                </button>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1m4 0h2m-6 0h2" />
                </svg>
                <p className="text-gray-600 mb-2">No messages found</p>
                <p className="text-gray-500 text-sm">
                  {filter === 'all' ? 'No messages yet' : `No ${filter} messages`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      message.status === 'unread' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{message.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {message.status}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {message.source || 'website'}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">
                            <strong>Phone:</strong> {message.phone}
                          </p>
                          <p className="text-sm text-gray-600">
                            <strong>Time:</strong> {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-800">{message.message}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {message.status === 'unread' ? (
                          <button
                            onClick={() => markAsRead(message.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Mark Read
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsUnread(message.id)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs transition-colors"
                          >
                            Mark Unread
                          </button>
                        )}
                        
                        <a
                          href={`tel:${message.phone}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors text-center"
                        >
                          Call
                        </a>
                        
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
