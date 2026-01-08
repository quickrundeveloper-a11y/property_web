"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function FixPhoneNumbers() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const router = useRouter();

  const fixPhoneNumbers = async () => {
    setLoading(true);
    setResult("Starting to fix phone numbers...\n");
    
    try {
      // Fetch all properties
      const q = query(collection(db, "properties"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      setResult(prev => prev + `Found ${snapshot.docs.length} properties\n`);
      
      const phoneNumbers = [
        "+91-9876543210",
        "+91-9876543211", 
        "+91-9876543212",
        "+91-9876543213",
        "+91-9876543214",
        "+91-9876543215"
      ];
      
      let updateCount = 0;
      
      for (let i = 0; i < snapshot.docs.length; i++) {
        const docRef = snapshot.docs[i];
        const data = docRef.data();
        const phoneNumber = phoneNumbers[i] || phoneNumbers[phoneNumbers.length - 1];
        
        setResult(prev => prev + `Updating property ${i + 1}: ${data.title || data.name || 'Unnamed'} with ${phoneNumber}\n`);
        
        // Update the document with phone number
        await updateDoc(doc(db, "properties", docRef.id), {
          phone: phoneNumber,
          contact: phoneNumber,
          phoneNumber: phoneNumber, // Add multiple field names just in case
          updatedAt: new Date().toISOString()
        });
        
        updateCount++;
        setResult(prev => prev + `✅ Updated property ${i + 1}\n`);
      }
      
      setResult(prev => prev + `\n🎉 Successfully updated ${updateCount} properties!\n`);
      setResult(prev => prev + `Now refresh the home page to see dynamic phone numbers.\n`);
      
    } catch (error) {
      console.error("Error fixing phone numbers:", error);
      setResult(prev => prev + `❌ Error: ${error}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Fix Phone Numbers</h1>
          <p className="text-gray-600 mb-6">
            This will add unique phone numbers to all existing properties in Firebase.
          </p>

          <div className="space-y-4">
            <button
              onClick={fixPhoneNumbers}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors font-medium"
            >
              {loading ? "Fixing Phone Numbers..." : "🔧 Fix Phone Numbers Now"}
            </button>

            {result && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                {result}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => router.push("/home")}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Home Page
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Phone Numbers to be assigned:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Property 1: +91-9876543210</li>
              <li>• Property 2: +91-9876543211</li>
              <li>• Property 3: +91-9876543212</li>
              <li>• Property 4: +91-9876543213</li>
              <li>• Property 5: +91-9876543214</li>
              <li>• Property 6: +91-9876543215</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}