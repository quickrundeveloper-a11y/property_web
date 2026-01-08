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
  updateDoc,
  doc,
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

export default function AdminSMSPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp'>('sms');
  const [loading, setLoading] = useState(false);

  // Check if user is admin
  const isAdmin = user?.email === "admin@hommie.com" || 
                  user?.email?.includes("admin") ||
                  user?.email === "test@admin.com";

  useEffect(() => {
    if (!user) {
      router.push("/auth");
      return;
    }
    
    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, router]);

  // Load all SMS messages
  useEffect(() => {
    if (!isAdmin) return;

    const smsQuery = query(
      collection(db, "sms"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(smsQuery, (snapshot) => {
      const messageList: SMSMessage[] = [];
      
      snapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() } as SMSMessage;
        messageList.push(messageData);
      });
      
      setSmsMessages(messageList);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const sendBulkSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !phoneNumber.trim() || loading) return;

    setLoading(true);
    try {
      // Split phone numbers by comma or newline
      const phoneNumbers = phoneNumber.split(/[,\n]/).map(num => num.trim()).filter(num => num);
      
      for (const phone of phoneNumbers) {
        await addDoc(collection(db, "sms"), {
          message: newMessage.trim(),
          phoneNumber: phone,
          senderId: user?.uid,
          senderEmail: user?.email,
          senderName: "Hommie Admin",
          userId: user?.uid || "admin",
          timestamp: serverTimestamp(),
          status: 'pending',
          type: messageType,
          isRead: false,
        });
      }

      setNewMessage("");
      setPhoneNumber("");
      alert(`${phoneNumbers.length} ${messageType.toUpperCase()} messages queued for sending!`);
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Error sending messages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'sent' | 'failed') => {
    try {
      await updateDoc(doc(db, "sms", messageId), {
        status: status
      });
    } catch (error) {
      console.error("Error updating message status:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to access this admin panel.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">SMS/WhatsApp Admin Panel</h1>
              <p className="text-gray-600">Send bulk messages to clients</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {smsMessages.length} total messages
              </div>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Message Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Send Bulk Messages</h2>
            
            {/* Message Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMessageType('sms')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageType === 'sms' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📱 SMS
                </button>
                <button
                  onClick={() => setMessageType('whatsapp')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    messageType === 'whatsapp' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>

            <form onSubmit={sendBulkSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Numbers (comma or line separated)
                </label>
                <textarea
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +919876543210, +919876543211&#10;or one per line"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Content
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Type your ${messageType} message here...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  disabled={loading}
                  maxLength={160}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newMessage.length}/160 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || !phoneNumber.trim() || loading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors duration-200"
              >
                {loading ? "Sending..." : `Send ${messageType.toUpperCase()} Messages`}
              </button>
            </form>
          </div>

          {/* Message History */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Message History</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {smsMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📱</div>
                  <p>No messages sent yet</p>
                </div>
              ) : (
                smsMessages.map((message) => (
                  <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">
                          {message.type.toUpperCase()}: {message.phoneNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {getStatusIcon(message.status)} {message.status}
                        </span>
                      </div>
                      {message.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => updateMessageStatus(message.id, 'sent')}
                            className="text-green-600 hover:text-green-800 text-xs"
                          >
                            Mark Sent
                          </button>
                          <button
                            onClick={() => updateMessageStatus(message.id, 'failed')}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Mark Failed
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{message.message}</p>
                    <p className="text-gray-400 text-xs">
                      Sent by: {message.senderName} • {formatTime(message.timestamp)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
