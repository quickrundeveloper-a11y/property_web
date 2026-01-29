"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function UpdatePhoneNumbers() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  // Phone numbers to assign to properties
  const phoneNumbers = [
    "+91-9876543210",
    "+91-9876543211", 
    "+91-9876543212",
    "+91-9876543213",
    "+91-9876543214",
    "+91-9876543215",
    "+91-9876543216",
    "+91-9876543217",
    "+91-9876543218",
    "+91-9876543219"
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "property_All", "main", "properties"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(data);
      console.log("Current properties:", data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePhoneNumbers = async () => {
    setUpdating(true);
    try {
      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const phoneNumber = phoneNumbers[i] || phoneNumbers[phoneNumbers.length - 1];
        
        await updateDoc(doc(db, "property_All", "main", "properties", property.id), {
          phone: phoneNumber,
          contact: phoneNumber,
          updatedAt: new Date()
        });
        
        console.log(`Updated property ${property.id} with phone: ${phoneNumber}`);
      }
      
      alert(`Successfully updated ${properties.length} properties with phone numbers!`);
      router.push("/home");
    } catch (error) {
      console.error("Error updating properties:", error);
      alert("Error updating properties. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Update Phone Numbers</h1>
          <p className="text-gray-600 mb-6">
            This will add phone numbers to existing properties in Firebase.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading properties...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Found {properties.length} properties to update:
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {properties.map((property, index) => (
                    <div key={property.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            {property.title || property.name || `Property ${index + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {property.location || property.address || "No location"}
                          </p>
                          <p className="text-sm text-blue-600">
                            Current phone: {property.phone || property.contact || "None"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            Will set: {phoneNumbers[index] || phoneNumbers[phoneNumbers.length - 1]}
                          </p>
                          <p className="text-xs text-gray-500">ID: {property.id}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push("/home")}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={fetchProperties}
                  disabled={loading}
                  className="bg-blue-100 text-blue-800 py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={updatePhoneNumbers}
                  disabled={updating || properties.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {updating ? "Updating..." : `Update ${properties.length} Properties`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
