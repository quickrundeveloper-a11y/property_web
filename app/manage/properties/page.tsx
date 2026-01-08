"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface Property {
  id: string;
  title?: string;
  name?: string;
  location?: string;
  address?: string;
  price?: number | string;
  rent?: number | string;
  cost?: number | string;
  images?: string[];
  image?: string;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  baths?: number;
  area?: string | number;
  sqft?: string | number;
  phone?: string;
  contact?: string;
}

export default function MyProperties() {
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Get user ID (you might want to implement proper auth)
  const getUserId = () => {
    return localStorage.getItem('userId') || 'guest-user';
  };

  const formatPrice = (property: Property) => {
    const price = property.price || property.rent || property.cost || 25000;
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : Number(price);
    return isNaN(numPrice) ? 25000 : numPrice;
  };

  useEffect(() => {
    fetchFavoriteProperties();
  }, []);

  const fetchFavoriteProperties = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      
      // Fetch favorite property IDs for this user
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", userId)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      
      if (favoritesSnapshot.empty) {
        setFavoriteProperties([]);
        return;
      }

      // Get property IDs
      const propertyIds = favoritesSnapshot.docs.map(doc => doc.data().propertyId);
      
      // Fetch all properties
      const propertiesSnapshot = await getDocs(collection(db, "properties"));
      const allProperties = propertiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter properties that are in favorites
      const favoriteProps = allProperties.filter(prop => propertyIds.includes(prop.id));
      
      setFavoriteProperties(favoriteProps);
    } catch (error) {
      console.error("Error fetching favorite properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (propertyId: string) => {
    try {
      const userId = getUserId();
      
      // Find and delete the favorite record
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("propertyId", "==", propertyId)
      );
      const snapshot = await getDocs(favoritesQuery);
      
      snapshot.docs.forEach(async (docRef) => {
        await deleteDoc(doc(db, "favorites", docRef.id));
      });

      // Update local state
      setFavoriteProperties(prev => prev.filter(prop => prop.id !== propertyId));
      
      alert("Property removed from favorites!");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      alert("Error removing property from favorites");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favourite Property</h1>
              <p className="text-gray-600 mt-1">Your favorite properties ({favoriteProperties.length})</p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {favoriteProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Favorite Properties</h2>
            <p className="text-gray-600 mb-6">
              You haven’t added any properties to your favorites yet. 
              Click the heart icon on any property to add it here!
            </p>
            <button
              onClick={() => router.push("/home")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProperties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={property.images?.[0] || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                    className="h-48 w-full object-cover"
                    alt={property.title || property.name || "Property"}
                  />
                  
                  {/* POPULAR Badge */}
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    FAVORITE
                  </div>
                  
                  {/* Remove from Favorites */}
                  <button 
                    onClick={() => removeFromFavorites(property.id)}
                    className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-blue-600 font-bold text-lg">
                      ₹{formatPrice(property).toLocaleString()}
                      <span className="text-gray-400 text-sm font-normal">/month</span>
                    </p>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 text-base mb-2">
                    {property.title || property.name || "Property"}
                  </h3>
                  
                  <p className="text-sm text-gray-500 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {property.location || property.address || "Location"}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {property.bedrooms || property.beds || 3} Beds
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      {property.bathrooms || property.baths || 2} Bathrooms
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 000 2v9a2 2 0 002 2h6a2 2 0 002-2V6a1 1 0 100-2H3zm6 2a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {property.area || property.sqft || "5x7"} m²
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {property.phone || property.contact || "+91-9876543210"}
                    </div>
                    <button 
                      onClick={() => router.push(`/property/${property.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
