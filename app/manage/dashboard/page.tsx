"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Bed, Bath, Square, Edit, Trash2 } from "lucide-react";

interface Property {
  id: string;
  title?: string;
  location?: string;
  price?: number | string;
  images?: string[];
  image?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string | number;
  priceUnit?: string;
  [key: string]: any;
}

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "property_All", "main", "properties"));
        const props = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property));
        setProperties(props);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      await deleteDoc(doc(db, "property_All", "main", "properties", id));
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting property:", error);
      alert("Failed to delete property");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button 
            onClick={() => router.push("/add-property")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Property
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-48 bg-gray-200">
                <Image
                  src={property.images?.[0] || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                  alt={property.title || "Property"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => router.push(`/manage/properties/edit/${property.id}`)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
                    title="Edit Property"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(property.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                    title="Delete Property"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">{property.title || "Untitled Property"}</h3>
                <p className="text-gray-500 text-sm mb-3 truncate">{property.location || "No location"}</p>
                
                <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    <span>{property.bedrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    <span>{property.bathrooms || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Square className="w-4 h-4" />
                    <span>{property.area || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className="font-bold text-blue-600">
                    ₹{property.price?.toLocaleString() || 0}
                    <span className="text-xs font-normal text-gray-400 ml-1">
                       {property.priceUnit?.replace('per_', '/') || ''}
                    </span>
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${property.type === 'rent' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {property.type === 'rent' ? 'For Rent' : 'For Sale'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
