"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function FixImagesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const snapshot = await getDocs(collection(db, "properties"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProperties(data);
        console.log("Properties for image fix:", data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const addImagesToProperty = async (propertyId: string) => {
    try {
      const sampleImages = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
      ];

      await updateDoc(doc(db, "properties", propertyId), {
        images: sampleImages,
        image: sampleImages[0]
      });

      alert("Images added successfully!");
      
      // Refresh the list
      const snapshot = await getDocs(collection(db, "properties"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(data);
    } catch (error) {
      console.error("Error adding images:", error);
      alert("Error adding images");
    }
  };

  const addImagesToAllProperties = async () => {
    try {
      const sampleImages = [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
      ];

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        const randomImage = sampleImages[i % sampleImages.length];
        
        await updateDoc(doc(db, "properties", property.id), {
          images: [randomImage],
          image: randomImage
        });
      }

      alert(`Images added to all ${properties.length} properties!`);
      
      // Refresh the list
      const snapshot = await getDocs(collection(db, "properties"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProperties(data);
    } catch (error) {
      console.error("Error adding images to all properties:", error);
      alert("Error adding images to all properties");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <h1 className="text-2xl font-bold">Fix Property Images</h1>
            <p className="text-blue-100 mt-1">Add images to properties that don't have them</p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <button
                onClick={addImagesToAllProperties}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Add Images to All Properties ({properties.length})
              </button>
            </div>

            <div className="grid gap-4">
              {properties.map((property) => (
                <div key={property.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {property.title || property.name || "Unnamed Property"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ID: {property.id}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {property.location || property.address || "No location"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Price: ₹{property.price?.toLocaleString() || "Not set"}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">Images:</span>{" "}
                          {property.images?.length ? (
                            <span className="text-green-600">
                              {property.images.length} images ✓
                            </span>
                          ) : property.image ? (
                            <span className="text-yellow-600">
                              1 image (legacy) ⚠️
                            </span>
                          ) : (
                            <span className="text-red-600">
                              No images ❌
                            </span>
                          )}
                        </p>
                        {(property.images?.[0] || property.image) && (
                          <div className="mt-2">
                            <img
                              src={property.images?.[0] || property.image}
                              alt="Property"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => addImagesToProperty(property.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Add Images
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {properties.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No properties found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}