"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Bed, Bath, Heart, Square } from "lucide-react";

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
  priceUnit?: string;
  areaUnit?: string;
  area_unit?: string;
  propertyCategory?: string;
}

export default function MyProperties() {
  const [favoriteProperties, setFavoriteProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const formatPrice = (property: Property) => {
    const price = property.price || property.rent || property.cost || 25000;
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : Number(price);
    return isNaN(numPrice) ? 25000 : numPrice;
  };

  const getPriceSuffix = (property: Property) => {
    const unit = String(property.priceUnit || '').toLowerCase();
    const map: Record<string, string> = {
      per_month: '/month',
      per_year: '/year',
      per_sqft: '/sq ft',
      per_sqyards: '/sq yards',
      per_sqm: '/sq m',
      per_acre: '/acre',
      per_marla: '/marla',
      per_cents: '/cents',
      per_bigha: '/bigha',
      per_kottah: '/kottah',
      per_kanal: '/kanal',
      per_grounds: '/grounds',
      per_ares: '/ares',
      per_biswa: '/biswa',
      per_guntha: '/guntha',
      per_aankadam: '/aankadam',
      per_hectares: '/hectares',
      per_rood: '/rood',
      per_chataks: '/chataks',
      per_perch: '/perch'
    };
    return map[unit] || '/month';
  };

  useEffect(() => {
    if (!user || user.isAnonymous) {
       setLoading(false);
       if (user?.isAnonymous) router.push("/auth");
       return;
    }

    setLoading(true);
    // Listen to the 'favorites' collection in real-time
    const favoritesQuery = collection(db, "property_All", "main", "users", user.uid, "favorites");
    
    const unsubscribe = onSnapshot(favoritesQuery, async (snapshot) => {
      if (snapshot.empty) {
        setFavoriteProperties([]);
        setLoading(false);
        return;
      }

      const propertyIds = snapshot.docs.map(doc => doc.id);
      
      try {
        const propertyPromises = propertyIds.map(async (id) => {
            try {
                const propRef = doc(db, "property_All", "main", "properties", id);
                const propSnap = await getDoc(propRef);
                if (propSnap.exists()) {
                    return { id: propSnap.id, ...propSnap.data() } as Property;
                }
                return null;
            } catch (err) {
                console.error(`Error fetching property ${id}:`, err);
                return null;
            }
        });

        const properties = await Promise.all(propertyPromises);
        setFavoriteProperties(properties.filter((p): p is Property => p !== null));
      } catch (error) {
        console.error("Error processing favorites:", error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to favorites:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  const removeFromFavorites = async (propertyId: string) => {
    if (!user) return;
    try {
      // Delete the favorite record from 'favorites' collection
      await deleteDoc(doc(db, "property_All", "main", "users", user.uid, "favorites", propertyId));
      // State update is handled by onSnapshot
    } catch (error) {
      console.error("Error removing favorite:", error);
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
      <div className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div>
            <h1 className="text-3xl font-bold text-[#000929]">My Favourite Property</h1>
            <p className="text-gray-600 mt-2">Your favorite properties ({favoriteProperties.length})</p>
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteProperties.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-lg border border-gray-100 overflow-visible hover:shadow-xl transition-all duration-300 cursor-pointer group relative max-w-xs mx-auto w-full"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <Image
                    src={property.images?.[0] || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                    alt={property.title || property.name || "Property"}
                    fill
                  />
                </div>
                
                <div className="p-4 pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[#0066FF] text-lg">
                        ₹{formatPrice(property).toLocaleString("en-IN")}
                        <span className="text-gray-400 text-xs font-normal ml-1">{getPriceSuffix(property)}</span>
                      </h3>
                      <h3 className="font-bold text-[#000929] text-base mt-1 truncate max-w-[160px]">
                        {property.title || property.name || "Property Name"}
                      </h3>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavorites(property.id);
                      }}
                      className="w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                      title="Remove from favorites"
                    >
                      <Heart className="w-4 h-4" fill="currentColor" stroke="currentColor" strokeWidth={2} />
                    </button>
                  </div>
                  
                  <p className="text-gray-500 text-xs mb-4 truncate border-b border-gray-100 pb-3">
                    {property.location || property.address || "Location Address"}
                  </p>
                  
                  <div className="flex items-center justify-between text-gray-500">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span className="text-[10px]"><span className="font-bold text-gray-700">{property.bedrooms || property.beds || 3}</span> Beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span className="text-[10px]"><span className="font-bold text-gray-700">{property.bathrooms || property.baths || 2}</span> Baths</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span className="text-[10px]">
                        <span className="font-bold text-gray-700">{property.area || property.sqft || "5x7"}</span> {String((property as any).units || property.areaUnit || property.area_unit || 'sqft').toLowerCase()}
                      </span>
                    </div>
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
