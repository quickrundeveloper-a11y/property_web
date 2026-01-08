"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";

export default function DebugProperties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "properties"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(data);
      setMessage(`Found ${data.length} properties in Firebase`);
      
      // Log to console for debugging
      console.log("All Properties from Firebase:", data);
      data.forEach((prop, index) => {
        console.log(`Property ${index + 1}:`, prop);
      });
    } catch (error) {
      console.error("Error:", error);
      setMessage(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllProperties = async () => {
    if (!confirm("Are you sure you want to delete ALL properties?")) return;
    
    setLoading(true);
    try {
      for (const property of properties) {
        await deleteDoc(doc(db, "properties", property.id));
      }
      setMessage("All properties deleted");
      setProperties([]);
    } catch (error) {
      setMessage(`Error deleting: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addTestProperties = async () => {
    setLoading(true);
    try {
      const testProperties = [
        {
          title: "Eco Village - 1",
          name: "Eco Village - 1",
          location: "sector-50",
          address: "sector-50",
          price: 100000,
          rent: 100000,
          bedrooms: 5,
          beds: 5,
          bathrooms: 2,
          baths: 2,
          area: "4999 m²",
          sqft: "4999 m²",
          phone: "+91-9876543210",
          contact: "+91-9876543210",
          phoneNumber: "+91-9876543210",
          image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
          createdAt: serverTimestamp(),
          status: "active"
        },
        {
          title: "Eco Village - 2",
          name: "Eco Village - 2", 
          location: "sector-50",
          address: "sector-50",
          price: 10000,
          rent: 10000,
          bedrooms: 3,
          beds: 3,
          bathrooms: 2,
          baths: 2,
          area: "1000 m²",
          sqft: "1000 m²",
          phone: "+91-9876543211",
          contact: "+91-9876543211",
          phoneNumber: "+91-9876543211",
          image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
          createdAt: serverTimestamp(),
          status: "active"
        },
        {
          title: "999999999999999",
          name: "999999999999999",
          location: "sector-124",
          address: "sector-124",
          price: 90000,
          rent: 90000,
          bedrooms: 5,
          beds: 5,
          bathrooms: 3,
          baths: 3,
          area: "9000 m²",
          sqft: "9000 m²",
          phone: "+91-9876543212",
          contact: "+91-9876543212",
          phoneNumber: "+91-9876543212",
          image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
          images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"],
          createdAt: serverTimestamp(),
          status: "active"
        }
      ];

      for (const property of testProperties) {
        await addDoc(collection(db, "properties"), property);
      }
      
      setMessage("Test properties added with phone numbers!");
      await fetchProperties();
    } catch (error) {
      setMessage(`Error adding properties: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Debug Properties</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{message}</p>
          </div>

          <div className="flex space-x-4 mb-6">
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {loading ? "Loading..." : "Refresh Properties"}
            </button>
            
            <button
              onClick={addTestProperties}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              Add Test Properties
            </button>
            
            <button
              onClick={deleteAllProperties}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300"
            >
              Delete All Properties
            </button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Properties in Firebase ({properties.length})</h2>
            
            {properties.length === 0 ? (
              <p className="text-gray-500">No properties found</p>
            ) : (
              properties.map((property, index) => (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {property.title || property.name || `Property ${index + 1}`}
                      </h3>
                      <p className="text-gray-600">ID: {property.id}</p>
                      <p className="text-gray-600">Location: {property.location || property.address || "N/A"}</p>
                      <p className="text-blue-600">Price: ₹{(property.price || property.rent || 0).toLocaleString()}</p>
                    </div>
                    
                    <div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Phone:</span>
                          <span className={`px-2 py-1 rounded text-sm ${property.phone ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {property.phone || "NOT SET"}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Contact:</span>
                          <span className={`px-2 py-1 rounded text-sm ${property.contact ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {property.contact || "NOT SET"}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">PhoneNumber:</span>
                          <span className={`px-2 py-1 rounded text-sm ${property.phoneNumber ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {property.phoneNumber || "NOT SET"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        <p>All fields: {Object.keys(property).join(", ")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
