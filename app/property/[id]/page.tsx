"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, runTransaction, serverTimestamp, collection, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/app/context/ChatContext";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  ArrowLeft, 
  Phone, 
  MessageCircle, 
  User, 
  Calendar, 
  Home,
  CheckCircle2,
  Share2,
  Heart,
  Building2,
  Layers,
  Info,
  ShieldCheck,
  X,
  ImageIcon
} from "lucide-react";

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  beds?: number;
  bedrooms?: number;
  baths?: number;
  bathrooms?: number;
  size?: string;
  area?: string;
  propertyCategory?: string;
  amenities?: string[];
  features: string[];
  phone?: string;
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
  contact?: string;
  priceUnit?: string;
  OwnerName?: string;
  sellerName?: string;
  ownerId?: string;
  userId?: string;
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChat();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      if (!user || !params.id || typeof params.id !== 'string') return;
      try {
        const favRef = doc(db, "property_All", "main", "users", user.uid, "favorites", params.id);
        const favDoc = await getDoc(favRef);
        setIsFavorite(favDoc.exists());
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [user, params.id]);

  const toggleFavorite = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!params.id || typeof params.id !== 'string') return;

    try {
      const favRef = doc(db, "property_All", "main", "users", user.uid, "favorites", params.id);
      if (isFavorite) {
        await deleteDoc(favRef);
        setIsFavorite(false);
      } else {
        await setDoc(favRef, {
          propertyId: params.id,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = `Check out this property: ${property?.title}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
    setShowShareOptions(false);
  };

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
          const docRef = doc(db, "property_All", "main", "properties", params.id as string);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h1>
          <p className="text-slate-500 mb-6">The property you&apos;re looking for might have been removed or is temporarily unavailable.</p>
          <button
            onClick={() => router.push("/home")}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-all w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const allImages = property.images || [property.image];

  const getPriceSuffix = () => {
    const unit = String(property.priceUnit || '').toLowerCase();
    if (unit === 'per_year') return '/year';
    if (unit === 'per_sqft') return '/sq ft';
    if (unit === 'per_sqm') return '/sq m';
    if (unit === 'per_acre') return '/acre';
    if (unit === 'per_bigha') return '/bigha';
    if (unit === 'per_katha') return '/katha';
    if (unit === 'per_gaj') return '/gaj';
    return '/month';
  };

  const isLand = String(property.propertyCategory || "").toLowerCase() === "land";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-2 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back
          </button>
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {showShareOptions && (
              <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 w-48 flex flex-col gap-1">
                <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Phone className="w-3 h-3" />
                  </div>
                  WhatsApp
                </button>
                <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <User className="w-3 h-3" />
                  </div>
                  Facebook
                </button>
                <button onClick={() => handleShare('copy')} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg text-left">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Share2 className="w-3 h-3" />
                  </div>
                  Copy Link
                </button>
              </div>
            )}
            <button 
              onClick={toggleFavorite}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                isFavorite 
                  ? "border-red-100 bg-red-50 text-red-500" 
                  : "border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-500 hover:border-red-100"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - Property Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="relative group w-full aspect-[4/3] md:h-[600px] md:aspect-auto">
                <Image
                  src={allImages[selectedImageIndex] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-700 cursor-pointer"
                  onClick={() => setShowAllPhotos(true)}
                />
                
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-slate-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                    {property.type || "For Rent"}
                  </span>
                  {property.status && (
                    <span className="bg-green-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      {property.status}
                    </span>
                  )}
                </div>

                {allImages.length > 1 && (
                  <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    {selectedImageIndex + 1} / {allImages.length} Photos
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all snap-start ${
                          selectedImageIndex === index
                            ? "border-blue-600 ring-2 ring-blue-100 scale-105 shadow-md"
                            : "border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-300"
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${property.title} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{property.title}</h1>
                  <div className="flex items-center text-slate-500 font-medium text-lg">
                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                    {property.location}
                  </div>
                </div>
                {/* Price for Mobile */}
                <div className="lg:hidden text-right">
                   <div className="text-2xl font-bold text-blue-600">
                     ₹{property.price?.toLocaleString('en-IN')}
                   </div>
                   <div className="text-slate-500 text-sm">{getPriceSuffix()}</div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {!isLand && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                      <Bed className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-900 text-lg">{property.beds || property.bedrooms || 4}</div>
                    <div className="text-slate-500 text-xs uppercase tracking-wide">Bedrooms</div>
                  </div>
                )}
                {!isLand && (
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-colors">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                      <Bath className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-900 text-lg">{property.baths || property.bathrooms || 3}</div>
                    <div className="text-slate-500 text-xs uppercase tracking-wide">Bathrooms</div>
                  </div>
                )}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-900 text-lg">{property.size || property.area || "2500"}</div>
                  <div className="text-slate-500 text-xs uppercase tracking-wide">Sq Ft</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-4">About this property</h2>
              <p className="text-slate-600 leading-relaxed">
                {property.description || `${property.title} located in ${property.location}. This property features modern amenities and spacious living areas suitable for families. It offers a perfect blend of comfort and luxury.`}
              </p>
            </div>

            {/* Property Details Grid */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                 <div className="space-y-4">
                    {property.developer && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Building2 className="w-4 h-4 mr-2"/> Developer</span>
                         <span className="font-medium text-slate-900">{property.developer}</span>
                      </div>
                    )}
                    {property.project && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Home className="w-4 h-4 mr-2"/> Project</span>
                         <span className="font-medium text-slate-900">{property.project}</span>
                      </div>
                    )}
                    {property.floor && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Layers className="w-4 h-4 mr-2"/> Floor</span>
                         <span className="font-medium text-slate-900">{property.floor}</span>
                      </div>
                    )}
                    {property.status && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Info className="w-4 h-4 mr-2"/> Status</span>
                         <span className="font-medium text-slate-900">{property.status}</span>
                      </div>
                    )}
                 </div>
                 <div className="space-y-4">
                    {property.furnished && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Bed className="w-4 h-4 mr-2"/> Furnished</span>
                         <span className="font-medium text-slate-900">{property.furnished}</span>
                      </div>
                    )}
                    {property.ageOfConstruction && (
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <span className="flex items-center text-slate-500"><Calendar className="w-4 h-4 mr-2"/> Age</span>
                         <span className="font-medium text-slate-900">{property.ageOfConstruction}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                       <span className="flex items-center text-slate-500"><Home className="w-4 h-4 mr-2"/> Type</span>
                       <span className="font-medium text-slate-900">{property.type || "Residential"}</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Amenities & Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(property.features || ["Modular Kitchen", "Marble Flooring", "Balcony", "Parking Space"]).map((feature, index) => (
                  <div key={index} className="flex items-center p-3 rounded-xl bg-slate-50 text-slate-700 font-medium">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-3 text-green-600 flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card Desktop */}
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hidden lg:block">
                <div className="mb-6">
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Total Price</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">₹{property.price?.toLocaleString('en-IN')}</span>
                    <span className="text-slate-500 font-medium">{getPriceSuffix()}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                         <User className="w-6 h-6" />
                      </div>
                      <div>
                         <div className="text-xs text-slate-500 font-medium uppercase">Property Owner</div>
                         <div className="font-bold text-slate-900">{property.OwnerName || property.contactName || property.sellerName || "Property Owner"}</div>
                      </div>
                   </div>

                   <button 
                     onClick={async () => {
                       const sellerId =
                         property.sellerId ||
                         property.ownerId ||
                         property.userId ||
                         null;

                       if (!sellerId || !user || user.isAnonymous) {
                         if (!user || user.isAnonymous) {
                           router.push("/auth?fromContact=true");
                           return;
                         }
                         alert("This property owner cannot be contacted at the moment (Missing owner details).");
                         return;
                       }
                       const buyerName = user.displayName || "Buyer";
                       const sellerName = property.OwnerName || property.contactName || property.sellerName || "Property Owner";
                       const message = `Hi, I'm interested in ${property.title}`;
                       
                       const [uid1, uid2] = [user.uid, sellerId].sort();
                       const chatId = `${property.id}_${uid1}_${uid2}`;

                       try {
                         await runTransaction(db, async (transaction) => {
                           const chatRef = doc(db, "property_All", "main", "chats", chatId);
                           const chatDoc = await transaction.get(chatRef);

                           if (!chatDoc.exists()) {
                             transaction.set(chatRef, {
                               chatId,
                               propertyId: property.id,
                               propertyName: property.title,
                               users: [user.uid, sellerId],
                               userNames: {
                                 [user.uid]: buyerName,
                                 [sellerId]: sellerName
                               },
                               lastMessage: message,
                               lastSenderId: user.uid,
                               lastUpdated: serverTimestamp(),
                               unreadCounts: {
                                 [user.uid]: 0,
                                 [sellerId]: 1
                               },
                               buyerId: user.uid,
                               buyerName: buyerName,
                               sellerId: sellerId,
                               sellerName: sellerName,
                               participants: [user.uid, sellerId]
                             });

                             const messageRef = doc(collection(db, "property_All", "main", "chats", chatId, "messages"));
                             transaction.set(messageRef, {
                               text: message,
                               senderId: user.uid,
                               senderName: buyerName,
                               createdAt: serverTimestamp()
                             });
                           }
                         });

                         openChat(chatId);
                       } catch (error) {
                         console.error("Error creating chat:", error);
                         alert("Failed to start chat. Please try again.");
                       }
                     }}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-bold transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                   >
                     <MessageCircle className="w-5 h-5" />
                     Message Owner
                   </button>

                   <button 
                      onClick={() => {
                        if (!user || user.isAnonymous) {
                          router.push("/auth?fromContact=true");
                          return;
                        }
                        const phoneNumber = property.phone || property.contact || "+91-9876543210";
                        const validPhone = phoneNumber.replace(/[^\d+]/g, '').length > 5 ? phoneNumber : "+91-9876543210";
                        window.location.href = `tel:${validPhone}`;
                      }}
                     className="w-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 py-4 px-6 rounded-xl font-bold transition-all hover:shadow-md flex items-center justify-center gap-2"
                   >
                     <Phone className="w-5 h-5" />
                     Call Owner
                   </button>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <ShieldCheck className="w-4 h-4 text-green-500" />
                      <span>Verified Property</span>
                   </div>
                   <div className="text-xs text-slate-400 mt-2">
                      ID: {property.id.slice(-8).toUpperCase()}
                   </div>
                </div>
              </div>

              {/* Mobile Sticky Bottom Bar (Visible only on mobile) */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                   <button 
                     onClick={async () => {
                       // Same logic as above
                       const sellerId =
                         property.sellerId ||
                         property.ownerId ||
                         property.userId ||
                         null;

                       if (!sellerId || !user || user.isAnonymous) {
                         if (!user || user.isAnonymous) {
                           router.push("/auth?fromContact=true");
                           return;
                         }
                         alert("This property owner cannot be contacted at the moment (Missing owner details).");
                         return;
                       }
                       // ... logic ...
                        const buyerName = user.displayName || "Buyer";
                        const sellerName = property.OwnerName || property.contactName || property.sellerName || "Property Owner";
                        const message = `Hi, I'm interested in ${property.title}`;
                        
                        const [uid1, uid2] = [user.uid, sellerId].sort();
                        const chatId = `${property.id}_${uid1}_${uid2}`;

                        try {
                          await runTransaction(db, async (transaction) => {
                            const chatRef = doc(db, "property_All", "main", "chats", chatId);
                            const chatDoc = await transaction.get(chatRef);

                            if (!chatDoc.exists()) {
                              transaction.set(chatRef, {
                                chatId,
                                propertyId: property.id,
                                propertyName: property.title,
                                users: [user.uid, sellerId],
                                userNames: {
                                  [user.uid]: buyerName,
                                  [sellerId]: sellerName
                                },
                                lastMessage: message,
                                lastSenderId: user.uid,
                                lastUpdated: serverTimestamp(),
                                unreadCounts: {
                                  [user.uid]: 0,
                                  [sellerId]: 1
                                },
                                buyerId: user.uid,
                                buyerName: buyerName,
                                sellerId: sellerId,
                                sellerName: sellerName,
                                participants: [user.uid, sellerId]
                              });

                              const messageRef = doc(collection(db, "property_All", "main", "chats", chatId, "messages"));
                              transaction.set(messageRef, {
                                text: message,
                                senderId: user.uid,
                                senderName: buyerName,
                                createdAt: serverTimestamp()
                              });
                            }
                          });

                          openChat(chatId);
                        } catch (error) {
                          console.error("Error creating chat:", error);
                          alert("Failed to start chat. Please try again.");
                        }
                     }}
                     className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                   >
                     <MessageCircle className="w-5 h-5" />
                     Message
                   </button>
                   <button 
                      onClick={() => {
                        if (!user || user.isAnonymous) {
                          router.push("/auth?fromContact=true");
                          return;
                        }
                        const phoneNumber = property.phone || property.contact || "+91-9876543210";
                        const validPhone = phoneNumber.replace(/[^\d+]/g, '').length > 5 ? phoneNumber : "+91-9876543210";
                        window.location.href = `tel:${validPhone}`;
                      }}
                     className="flex-1 bg-slate-100 text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                   >
                     <Phone className="w-5 h-5" />
                     Call
                   </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Full Screen Gallery Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-8 sticky top-0 z-50 py-4 bg-black/95">
                <h2 className="text-white text-2xl font-bold">Property Photos ({allImages.length})</h2>
                <button 
                  onClick={() => setShowAllPhotos(false)}
                  className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {allImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`relative aspect-[4/3] group cursor-pointer rounded-xl overflow-hidden ${selectedImageIndex === idx ? 'ring-4 ring-blue-500' : ''}`}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setShowAllPhotos(false);
                    }}
                  >
                    <Image
                      src={img} 
                      alt={`Property view ${idx + 1}`} 
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
