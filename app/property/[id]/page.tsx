"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import FloatingSMSWidget from "@/app/components/floating-sms-widget";

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  beds: number;
  baths: number;
  size: string;
  amenities?: string[];
  features: string[];
  phone: string;
  image: string;
  images?: string[];
  description?: string;
  type?: string;
  developer?: string;
  project?: string;
  floor?: string;
  status?: string;
  furnished?: string;
  ageOfConstruction?: string;
  sellerId?: string | null;
  contactName?: string;
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params.id) return;

      try {
        // Check if it's a default property
        if (typeof params.id === 'string' && params.id.startsWith('default-')) {
          const defaultProperties = [
            {
              id: "default-1",
              title: "Luxury Villa with Pool",
              location: "Sector 15, Noida",
              price: 25000,
              beds: 4,
              baths: 3,
              size: "2500",
              features: ["Modular Kitchen", "Marble Flooring", "Balcony", "Parking Space"],
              phone: "+91-9876543210",
              image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
              images: [
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
              ],
              type: "For Rent",
              developer: "ABC Developers",
              project: "Luxury Villas",
              floor: "Ground Floor",
              status: "Ready to Move",
              furnished: "Semi-Furnished",
              ageOfConstruction: "New Construction",
              sellerId: "default-seller-1"
            },
            {
              id: "default-2",
              title: "Modern Apartment",
              location: "Noida",
              price: 100000,
              beds: 3,
              baths: 3,
              size: "1800",
              features: ["Modular Kitchen", "Wooden Flooring", "Balcony", "Parking Space"],
              phone: "08920393457",
              image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
              images: [
                "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2"
              ],
              type: "For Rent",
              developer: "XYZ Builders",
              project: "Modern Apartments",
              floor: "5th Floor",
              status: "Ready to Move",
              furnished: "Fully Furnished",
              ageOfConstruction: "2 Years"
            },
            {
              id: "default-3",
              title: "Cozy Studio",
              location: "Noida",
              price: 10000,
              beds: 1,
              baths: 1,
              size: "1000",
              features: ["Modern Kitchen", "Tile Flooring", "Balcony", "Parking Space"],
              phone: "08920393457",
              image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
              images: [
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2",
                "https://images.unsplash.com/photo-1564013799919-ab600027ffc6",
                "https://images.unsplash.com/photo-1570129477492-45c003edd2be"
              ],
              type: "For Rent",
              developer: "PQR Constructions",
              project: "Studio Apartments",
              floor: "3rd Floor",
              status: "Ready to Move",
              furnished: "Unfurnished",
              ageOfConstruction: "1 Year"
            }
          ];
          
          const defaultProperty = defaultProperties.find(p => p.id === params.id);
          if (defaultProperty) {
            setProperty(defaultProperty);
          }
        } else {
          // Fetch from Firebase
          const docRef = doc(db, "properties", params.id as string);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const propertyData = { 
              id: docSnap.id, 
              ...data,
              size: data.area || data.size || "0"
            } as Property;
            setProperty(propertyData);
          } else {
            console.log("No such property!");
          }
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Property Not Found</h1>
          <button
            onClick={() => router.push("/home")}
            className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2 rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const allImages = property.images || [property.image];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
              <p className="text-gray-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {property.location}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-slate-700">
                ₹{property.price?.toLocaleString('en-IN')}
              </div>
              <div className="text-gray-500">/month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
              <div className="relative">
                <img
                  src={allImages[selectedImageIndex] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                />
                  <div className="absolute top-4 left-4 bg-slate-700 text-white px-3 py-1 rounded-lg text-sm font-medium">
                  {property.type || "For Rent"}
                </div>
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                    {selectedImageIndex + 1} / {allImages.length} Photos
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? "border-slate-700" : "border-gray-200"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${property.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Property Details</h2>
              
              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">{property.beds || 4}</div>
                  <div className="text-gray-600 text-sm">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">{property.baths || 3}</div>
                  <div className="text-gray-600 text-sm">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">{property.size || "2500"}</div>
                  <div className="text-gray-600 text-sm">Sq Ft</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">₹{Math.round((property.price || 25000) / (parseInt(property.size || "2500") || 2500))}</div>
                  <div className="text-gray-600 text-sm">Per Sq Ft</div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Property Information</h3>
                  <div className="space-y-2 text-sm">
                    {property.developer && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Developer:</span>
                        <span className="font-medium">{property.developer}</span>
                      </div>
                    )}
                    {property.project && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project:</span>
                        <span className="font-medium">{property.project}</span>
                      </div>
                    )}
                    {property.floor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Floor:</span>
                        <span className="font-medium">{property.floor}</span>
                      </div>
                    )}
                    {property.status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium">{property.status}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Additional Info</h3>
                  <div className="space-y-2 text-sm">
                    {property.furnished && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Furnished:</span>
                        <span className="font-medium">{property.furnished}</span>
                      </div>
                    )}
                    {property.ageOfConstruction && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{property.ageOfConstruction}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Type:</span>
                      <span className="font-medium">{property.type || "Residential"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>



            {/* Features */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(property.features || ["Modular Kitchen", "Marble Flooring", "Balcony", "Parking Space"]).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Owner</h2>
              
              <div className="mb-6">
                <div className="text-lg font-semibold text-gray-800 mb-1">Property Owner</div>
                <div className="text-gray-600 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {property.phone || "+91-9876543210"}
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Check Availability
                </button>

                <button 
                  onClick={() => {
                    const sellerId = property.sellerId || null;
                    if (!sellerId) {
                      alert("This property owner cannot be contacted at the moment (Missing owner details).");
                      return;
                    }
                    const event = new CustomEvent('open-chat', {
                      detail: {
                        contact: {
                          propertyId: property.id,
                          propertyTitle: property.title,
                          sellerId,
                          sellerName: property.contactName || "Property Owner",
                          phone: property.phone || "+91-9876543210",
                        },
                        message: `Hi, I'm interested in ${property.title}`
                      }
                    });
                    window.dispatchEvent(event);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Owner
                </button>
                
                <button className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                  Contact Owner
                </button>
                
                <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Brochure
                </button>
              </div>

              {/* Quick Info */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3">Quick Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property ID:</span>
                    <span className="font-medium">{property.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="font-medium">Recently</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{Math.floor(Math.random() * 500) + 100}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FloatingSMSWidget />
    </div>
  );
}
