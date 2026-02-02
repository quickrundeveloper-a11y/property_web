"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs, where, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Property } from "@/lib/types";
import Image from "next/image";

function PropertySearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    date: searchParams.get('date') || '',
    type: searchParams.get('type') || 'rent',
  });
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  const typeOptions = [
    { value: "rent", label: "For Rent" },
    { value: "buy", label: "For Sale" },
    { value: "sell", label: "Sell Property" },
  ];

  const normalizeType = (value: unknown) => {
    const v = String(value || "").toLowerCase();
    if (!v) return "";
    if (v.includes("rent")) return "rent";
    if (v.includes("sell")) return "sell";
    if (v.includes("sale") || v.includes("buy")) return "buy";
    return v;
  };

  const currentTypeLabel =
    typeOptions.find((option) => option.value === normalizeType(filters.type))?.label ||
    "Select property type";

  useEffect(() => {
    setFilters({
      location: searchParams.get('location') || '',
      date: searchParams.get('date') || '',
      type: searchParams.get('type') || 'rent',
    });
    setIsTypeOpen(false);
  }, [searchParams]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Using "property_All/main/properties" collection
        let q = query(collection(db, "property_All", "main", "properties"), orderBy("createdAt", "desc"));
        
        // Add location filter if specified
        if (filters.location) {
          // This is a simple contains search - in production you'd want more sophisticated location matching
          q = query(collection(db, "property_All", "main", "properties"), where("location", ">=", filters.location));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title || d.name || "Property",
            location: d.location || d.address || "",
            price: Number(d.price || d.rent || d.cost || 0),
            images: Array.isArray(d.images) ? d.images : (d.image ? [d.image] : []),
            bedrooms: Number(d.bedrooms || d.beds || 0),
            bathrooms: Number(d.bathrooms || d.baths || 0),
            area: String(d.area || d.sqft || ""),
            type: d.type || d.listingType || d.propertyType || "",
            priceUnit: d.priceUnit || d.price_unit || "",
            propertyCategory: d.propertyCategory || d.category || "",
          } as Property;
        });

        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [filters]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites(new Set());
        return;
      }
      try {
        const q = collection(db, "property_All", "main", "users", user.uid, "favorites");
        const snapshot = await getDocs(q);
        const favIds = new Set(snapshot.docs.map(doc => doc.id));
        setFavorites(favIds);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation(); // Prevent navigating to property detail
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      const isFavorite = favorites.has(propertyId);
      const favRef = doc(db, "property_All", "main", "users", user.uid, "favorites", propertyId);

      if (isFavorite) {
        await deleteDoc(favRef);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        await setDoc(favRef, {
          propertyId: propertyId,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setFavorites(prev => {
          const next = new Set(prev);
          next.add(propertyId);
          return next;
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(price) || 0);
  };

  const getPriceSuffix = (p: Property) => {
    const unit = String(p.priceUnit || '').toLowerCase();
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
    
    const type = normalizeType(p.type);
    const isSale = type === 'sell' || type === 'buy';
    
    if (map[unit]) {
      if (isSale && (unit === 'per_month' || unit === 'per_year')) return '';
      return map[unit];
    }
    
    if (type === 'rent') return '/month';
    return '';
  };

  const visibleProperties = properties.filter((p) => {
    const matchesType = normalizeType(p.type) === normalizeType(filters.type);
    if (!matchesType) return false;
    if (!filters.location) return true;
    return String(p.location || "").toLowerCase().includes(filters.location.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Property Search</h1>
              <p className="text-gray-600 mt-1">
                {filters.location && `Properties in ${filters.location}`}
                {filters.type && ` • ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`}
                {filters.date && ` • Move-in: ${new Date(filters.date).toLocaleDateString()}`}
              </p>
            </div>
            <button
              onClick={() => router.push("/home")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                placeholder="Enter city or area"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <button
                type="button"
                onClick={() => setIsTypeOpen(!isTypeOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="truncate">{currentTypeLabel}</span>
                <svg
                  className="w-4 h-4 ml-2 text-gray-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isTypeOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg max-h-60 overflow-y-auto">
                  {typeOptions.map((option) => {
                    const selected = normalizeType(filters.type) === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, type: option.value });
                          setIsTypeOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          selected ? "bg-blue-50 text-blue-600" : "text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : visibleProperties.length > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                Found {visibleProperties.length} properties
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleProperties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden"
                  onClick={() => window.location.href = `/property/${property.id}`}
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={property.images?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                      className="object-cover"
                      alt={property.title || "Property"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium z-10">
                      {filters.type.toUpperCase()}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, property.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm z-10"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${favorites.has(property.id) ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-3">
                  <p className="text-blue-600 font-bold text-lg">
                        {formatPrice(property.price || 2500000)}
                        <span className="text-gray-400 text-sm font-normal">
                          {getPriceSuffix(property)}
                        </span>
                  </p>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 text-base mb-2">
                      {property.title || "Beautiful Property"}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-4 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {property.location || "Prime Location"}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 gap-2">
                      {String(property.propertyCategory || "").toLowerCase() !== "land" && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        {property.bedrooms || 3} Beds
                      </div>
                      )}
                      {String(property.propertyCategory || "").toLowerCase() !== "land" && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {property.bathrooms || 2} Baths
                      </div>
                      )}
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 000 2v9a2 2 0 002 2h6a2 2 0 002-2V6a1 1 0 100-2H3zm6 2a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {property.area || "2000"} {String((property as any).units || '').toLowerCase() || 'sq ft'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all properties
            </p>
            <button
              onClick={() => window.location.href = '/home'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse All Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertySearch() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PropertySearchContent />
    </Suspense>
  );
}
