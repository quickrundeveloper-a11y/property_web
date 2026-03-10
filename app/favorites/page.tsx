"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Property } from "@/lib/types";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { Heart, MapPin, Bed, Bath, Square } from "lucide-react";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;
      
      try {
        const favoritesQuery = collection(db, "property_All", "main", "users", user.uid, "favorites");
        const snapshot = await getDocs(favoritesQuery);
        const favoriteIds = snapshot.docs.map(doc => doc.id);
        
        if (favoriteIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        const properties: Property[] = [];
        for (const id of favoriteIds) {
          const docRef = doc(db, "property_All", "main", "properties", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             properties.push({ id: docSnap.id, ...docSnap.data() } as Property);
          }
        }
        setFavorites(properties);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      if (!user) {
        // Optional: redirect to auth or show empty state
        setLoading(false);
      } else {
        fetchFavorites();
      }
    }
  }, [user, authLoading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Favorites</h1>
        
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <div 
                key={property.id}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <div className="relative h-48">
                  <Image
                    src={property.images?.[0] || property.image || "/placeholder.jpg"}
                    alt={property.title || "Property"}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md">
                    <Heart className="w-5 h-5 text-red-500 fill-current" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                     <h3 className="font-bold text-slate-900 line-clamp-1">{property.title}</h3>
                     <span className="font-bold text-blue-600">
                       {formatPrice(property.price || property.rent)}
                     </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {property.location || property.address}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Bed className="w-3 h-3" /> {property.bedrooms || property.beds} Beds
                    </div>
                    <div className="flex items-center gap-1">
                      <Bath className="w-3 h-3" /> {property.bathrooms || property.baths} Baths
                    </div>
                    <div className="flex items-center gap-1">
                      <Square className="w-3 h-3" /> {property.area || property.sqft} {property.areaUnit || "sq ft"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-900 font-medium mb-1">No favorites yet</p>
              <p className="text-gray-500 text-sm mb-4">Start exploring properties and save your favorites!</p>
              <button 
                onClick={() => router.push('/home')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Browse Properties
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
