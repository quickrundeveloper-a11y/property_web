"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function TestSMSPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createMessagesCollection = async () => {
    setLoading(true);
    try {
      // Create Messages collection with test data
      await addDoc(collection(db, "messages"), {
        text: "Welcome to Hommie Support! How can we help you today?",
        senderId: "admin",
        senderEmail: "admin@hommie.com",
        senderName: "Hommie Support",
        userId: "admin",
        timestamp: serverTimestamp(),
        isSupport: true,
        isRead: false,
      });

      // Add another test message
      await addDoc(collection(db, "messages"), {
        text: "Thank you for contacting us. We will respond shortly.",
        senderId: "admin",
        senderEmail: "admin@hommie.com", 
        senderName: "Hommie Support",
        userId: "admin",
        timestamp: serverTimestamp(),
        isSupport: true,
        isRead: false,
      });

      setMessage("✅ Messages collection created successfully! Check Firebase Console.");
    } catch (error) {
      console.error("Error creating messages collection:", error);
      setMessage("❌ Error creating collection. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const createSMSCollection = async () => {
    setLoading(true);
    try {
      // Create SMS collection with test data
      await addDoc(collection(db, "sms"), {
        message: "Welcome to Hommie SMS service! We will keep you updated.",
        phoneNumber: "+919876543210",
        senderId: "admin",
        senderEmail: "admin@hommie.com",
        senderName: "Hommie Admin",
        userId: "admin",
        timestamp: serverTimestamp(),
        status: "sent",
        type: "sms",
        isRead: false,
      });

      setMessage("✅ SMS collection created successfully! Check Firebase Console.");
    } catch (error) {
      console.error("Error creating SMS collection:", error);
      setMessage("❌ Error creating collection. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Firebase Collections Creator
        </h1>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-2">Create Firebase collections:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>&quot;messages&quot;</strong> - Chat messages collection</li>
              <li><strong>&quot;sms&quot;</strong> - SMS/WhatsApp collection</li>
            </ul>
          </div>

          <button
            onClick={createMessagesCollection}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors mb-3"
          >
            {loading ? "Creating..." : "Create \u2018messages\u2019 Collection"}
          </button>

          <button
            onClick={createSMSCollection}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create \u2018sms\u2019 Collection"}
          </button>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes("✅") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          <div className="text-xs text-gray-500 text-center">
            <p>After creating, refresh Firebase Console to see the collections.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
