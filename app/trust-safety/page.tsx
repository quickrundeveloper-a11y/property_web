"use client";

import { Shield, Lock, UserCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Trust & Safety</h1>
          <p className="text-xl text-gray-600">
            Your safety is our top priority. Learn how we keep Primenivaas secure.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex items-start space-x-4 mb-8">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Commitment</h2>
              <p className="text-gray-600 leading-relaxed">
                At Primenivaas, we are committed to building a trusted community for buyers, sellers, and renters. 
                We employ strict verification processes and advanced security measures to ensure that your property 
                journey is safe and transparent.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <UserCheck className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Verified Profiles</h3>
              </div>
              <p className="text-gray-600 text-sm">
                We verify user identities and property ownership documents to prevent fraud and ensure you are dealing with genuine people.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center mb-4">
                <Lock className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Secure Data</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Your personal information is encrypted and protected. We never share your contact details without your explicit consent.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
          <div className="flex items-center mb-6">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Safety Tips</h2>
          </div>
          
          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-900 mb-1">Never transfer money without viewing</h3>
              <p className="text-gray-600 text-sm">
                Do not make any advance payments or deposits before physically inspecting the property and verifying the documents.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-900 mb-1">Meet in safe locations</h3>
              <p className="text-gray-600 text-sm">
                When meeting a buyer or seller, choose a public place or the property location during daylight hours. Bring a friend along if possible.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-1">
              <h3 className="font-semibold text-gray-900 mb-1">Report suspicious activity</h3>
              <p className="text-gray-600 text-sm">
                If you encounter a listing that seems too good to be true or a user behaving suspiciously, please report it to us immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need to report an issue?</p>
          <Link 
            href="/contact" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
