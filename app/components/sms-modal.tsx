"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface SMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title?: string;
    name?: string;
    price?: number;
    rent?: number;
    cost?: number;
    location?: string;
    address?: string;
    phone?: string;
    contact?: string;
  };
}

export default function SMSModal({ isOpen, onClose, property }: SMSModalProps) {
  const [customMessage, setCustomMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const formatPrice = (property: any) => {
    const price = property.price || property.rent || property.cost || 25000;
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : Number(price);
    return isNaN(numPrice) ? 25000 : numPrice;
  };

  const getPresetMessage = () => {
    const propertyName = property.title || property.name || "Property";
    const propertyLocation = property.location || property.address || "Location";
    const propertyPrice = formatPrice(property);

    return `Hi! I'm interested in ${propertyName} located at ${propertyLocation} priced at ₹${propertyPrice.toLocaleString()}/month. Could you please provide more details about this property?`;
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const message = customMessage.trim() || getPresetMessage();
      const ownerPhone = property.phone || property.contact || "+91-9876543210";

      // Save SMS to Firebase
      await addDoc(collection(db, "sms"), {
        message: message,
        phoneNumber: ownerPhone,
        propertyId: property.id,
        propertyName: property.title || property.name || "Property",
        propertyLocation: property.location || property.address || "Location",
        propertyPrice: formatPrice(property),
        messageType: 'inquiry',
        timestamp: serverTimestamp(),
        status: 'sent',
        type: 'sms',
        isRead: false,
      });

      // Open SMS app with the message
      const smsUrl = `sms:${ownerPhone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl, '_blank');

      alert("Message prepared! Your SMS app should open now.");
      onClose();
      
      // Reset form
      setCustomMessage("");
    } catch (error) {
      console.error("Error sending SMS:", error);
      alert("Error preparing message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Send SMS</h2>
                <p className="text-green-100 text-sm">Contact property owner</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Property Info */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{property.title || property.name || "Property"}</h3>
              <p className="text-sm text-gray-600">{property.location || property.address || "Location"}</p>
              <p className="text-sm font-medium text-green-600">₹{formatPrice(property).toLocaleString()}/month</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSendSMS} className="p-6 space-y-4">
          {/* Message Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message Preview</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
              {getPresetMessage()}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add your custom message here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {customMessage.length}/160 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send SMS"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
