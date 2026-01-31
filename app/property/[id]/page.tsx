"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, runTransaction, serverTimestamp, collection, deleteDoc, setDoc, query, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/app/context/ChatContext";
import { getGuestId } from "@/utils/guestId";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
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
  ImageIcon,
  Video,
  FileText,
  Eye,
  Car,
  Sofa,
  Ruler,
  Compass,
  Waves,
  Trees,
  Droplets,
  Zap,
  Fan,
  Armchair,
  LandPlot,
  MoreVertical,
  ChevronRight,
  ArrowRight
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
  units?: string;
  propertyCategory?: string;
  amenities?: string[];
  features: string[];
  phone?: string;
  image: string;
  images?: string[];
  description?: string;
  videoUrl?: string;
  floorPlan?: string;
  type?: string; // rent or sell
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
  viewCount?: number;
  
  // New fields from add-property-form
  propertyType?: string; // residential, commercial, etc.
  totalFloors?: string | number;
  floorNumber?: string | number;
  furnishingStatus?: string;
  plotArea?: string | number;
  plotLength?: string | number;
  plotBreadth?: string | number;
  floorsAllowed?: string | number;
  boundaryWall?: string;
  openSides?: string | number;
  anyConstruction?: string;
  possessionBy?: string;
  balconies?: string | number;
  builtUpArea?: string | number;
  superBuiltUpArea?: string | number;
  otherRooms?: string[];
  coveredParking?: string | number;
  openParking?: string | number;
  availabilityStatus?: string;
  ageOfProperty?: string;
  facing?: string;
  overlooking?: string[];
  waterSource?: string[];
  flooring?: string;
  powerBackup?: string;
  facingRoadWidth?: string | number;
  facingRoadUnit?: string;
  ownership?: string;
  pricePerSqFt?: string | number;
  allInclusivePrice?: boolean;
  taxExcluded?: boolean;
  priceNegotiable?: boolean;
  uniqueDescription?: string;
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openChat } = useChat();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const q = query(
          collection(db, "property_All", "main", "properties"),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const props = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Property))
          .filter(p => p.id !== (Array.isArray(params.id) ? params.id[0] : params.id));
        
        setSimilarProperties(props);
      } catch (error) {
        console.error("Error fetching similar properties:", error);
      }
    };
    
    fetchSimilar();
  }, [params.id]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  useEffect(() => {
    const recordView = async () => {
      if (!params.id) return;
      const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      let userId = user?.uid;
      let isGuest = false;

      // Treat anonymous users as guests for view counting
      if (!user || user.isAnonymous) {
        userId = getGuestId() || undefined;
        isGuest = true;
      }

      if (!userId) return;

      try {
        await fetch('/api/views/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            userId,
            isGuest,
          }),
        });
      } catch (error) {
        console.error('Failed to record view:', error);
      }
    };

    if (!authLoading) {
      recordView();
    }
  }, [params.id, user, authLoading]);

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
              sellerId: "default-seller-1",
              propertyCategory: "Independent House/Villa"
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
              ageOfConstruction: "2 Years",
              propertyCategory: "Flat/Apartment"
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
              ageOfConstruction: "1 Year",
              propertyCategory: "1 RK/Studio Apartment"
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

  const images = property?.images && property.images.length > 0 ? property.images : (property?.image ? [property.image] : []);
  const mediaItems = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...(property?.videoUrl ? [{ type: 'video' as const, url: property.videoUrl }] : []),
    ...(property?.floorPlan ? [{ type: 'floorPlan' as const, url: property.floorPlan }] : [])
  ];

  const displayedIndex = mediaItems.length > 0
    ? Math.min(selectedImageIndex, mediaItems.length - 1)
    : 0;

  const getPriceSuffix = () => {
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

  const category = String(property.propertyCategory || "").toLowerCase();
  const isLand = category.includes("land") || category.includes("plot");
  
  const getAreaUnitLabel = () => {
    const unit = String(property.units || '').toLowerCase();
    if (unit) {
      const map: Record<string, string> = {
        sqft: 'Sq Ft',
        sqm: 'Sq M',
        sqyards: 'Sq Yards',
        acres: 'Acres',
        marla: 'Marla',
        cents: 'Cents',
        bigha: 'Bigha',
        kottah: 'Kottah',
        kanal: 'Kanal',
        grounds: 'Grounds',
        ares: 'Ares',
        biswa: 'Biswa',
        guntha: 'Guntha',
        aankadam: 'Aankadam',
        hectares: 'Hectares',
        rood: 'Rood',
        chataks: 'Chataks',
        perch: 'Perch'
      };
      return map[unit] || unit;
    }
    return 'Sq Ft';
  };

  const calculateEMI = (price: number) => {
    // Simple EMI Calculation: Price * 0.007 (approx for 8.5% for 20y)
    // If price is monthly rent, don't show EMI or show 0
    if (property.type === 'rent') return null;
    
    const emi = Math.round(price * 0.0072); // Approx factor
    if (emi > 100000) return `~ ${(emi/100000).toFixed(2)} Lac`;
    return `~ ${Math.round(emi/1000)}k`;
  };

  const handleMessageOwner = async () => {
     const sellerId = property.sellerId || property.ownerId || property.userId || null;
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
             userNames: { [user.uid]: buyerName, [sellerId]: sellerName },
             lastMessage: message,
             lastSenderId: user.uid,
             lastUpdated: serverTimestamp(),
             unreadCounts: { [user.uid]: 0, [sellerId]: 1 },
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
     }
  };

  const handleCallOwner = () => {
    if (!user || user.isAnonymous) {
      router.push("/auth?fromContact=true");
      return;
    }
    const phoneNumber = property.phone || property.contact || "+91-9876543210";
    const validPhone = phoneNumber.replace(/[^\d+]/g, '').length > 5 ? phoneNumber : "+91-9876543210";
    window.location.href = `tel:${validPhone}`;
  };

  const emiDisplay = calculateEMI(property.price);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pb-20 pt-6">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
        
        {/* Header Section */}
        <div className="mb-8">
           <div className="flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                 <div className="flex items-center gap-3 mb-3">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                       {property.type === 'rent' ? 'For Rent' : 'For Sale'}
                    </span>
                    {property.viewCount !== undefined && (
                       <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                          <Eye className="w-3 h-3" />
                          <span className="font-medium">{property.viewCount} Views</span>
                       </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">
                       <Calendar className="w-3 h-3" />
                       <span className="font-medium">Posted {property.ageOfProperty || "Recently"}</span>
                    </div>
                 </div>

                 <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                 
                 <div className="flex items-center flex-wrap gap-4 text-slate-600 mb-4">
                    <div className="flex items-center gap-1">
                       <MapPin className="w-4 h-4 text-blue-600" />
                       {property.location}
                    </div>
                 </div>

                 <div className="flex items-baseline gap-3">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                       ₹{property.price?.toLocaleString('en-IN')} 
                       {property.type === 'rent' && <span className="text-lg text-slate-500 font-normal">/mo</span>}
                    </h2>
                    {emiDisplay && (
                      <span className="text-sm text-blue-600 font-medium px-3 py-1 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                         EMI starts at {emiDisplay}
                      </span>
                    )}
                 </div>
              </div>

              {property.priceUnit && (
                 <div className="hidden md:block px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <span className="block text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Price Unit</span>
                    <span className="text-slate-900 font-bold">{property.priceUnit}</span>
                 </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN - Images (7 cols) */}
          <div className="lg:col-span-7 space-y-10">
            {/* Image Gallery */}
            <div className="space-y-4">
               <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl bg-slate-100 group shadow-lg shadow-slate-200/50">
                  {mediaItems[displayedIndex]?.type === 'video' ? (
                    <video src={mediaItems[displayedIndex].url} controls className="w-full h-full object-cover" />
                  ) : (
                    <Image
                       src={mediaItems[displayedIndex]?.url || '/placeholder-property.jpg'}
                       alt={property.title}
                       fill
                       className="object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                       onClick={() => setShowAllPhotos(true)}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <button 
                    onClick={() => setShowAllPhotos(true)}
                    className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md hover:bg-white text-slate-900 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                     <ImageIcon className="w-4 h-4" />
                     Show all {mediaItems.length} photos
                  </button>
               </div>

               {/* Thumbnails Row */}
               {mediaItems.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                     {mediaItems.map((item, index) => (
                        <button
                           key={index}
                           onClick={() => setSelectedImageIndex(index)}
                           className={`relative w-28 aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all transform hover:scale-105 ${
                              selectedImageIndex === index 
                                 ? "border-slate-900 ring-2 ring-slate-200 ring-offset-2 scale-105" 
                                 : "border-transparent opacity-70 hover:opacity-100 grayscale hover:grayscale-0"
                           }`}
                        >
                           {item.type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white"><Video className="w-6 h-6"/></div>
                           ) : (
                              <Image
                                 src={item.url}
                                 alt={`View ${index + 1}`}
                                 fill
                                 className="object-cover"
                              />
                           )}
                        </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Amenities Section */}
            {((property.features && property.features.length > 0) || (property.amenities && property.amenities.length > 0)) && (
               <div className="bg-slate-50 rounded-3xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CheckCircle2 className="w-6 h-6" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900">Amenities & Features</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                     {[...(property.features || []), ...(property.amenities || [])].map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-slate-700 font-medium p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                           {feature}
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* Description Section */}
            <div>
               <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-slate-400" />
                  About this property
               </h3>
               <div className="prose prose-slate max-w-none">
                  <p className="text-slate-600 leading-loose whitespace-pre-wrap text-lg">
                     {property.description || property.uniqueDescription || "No description available for this property."}
                  </p>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Details & Info (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-8">
            
              {/* Quick Stats - Grid Card Design */}
              <div className="grid grid-cols-3 gap-4">
                 {!isLand ? (
                    <>
                       <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors group">
                          <Bed className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                          <span className="font-bold text-slate-900 text-lg">{property.beds || property.bedrooms || 0}</span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Beds</span>
                       </div>
                       <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors group">
                          <Bath className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                          <span className="font-bold text-slate-900 text-lg">{property.baths || property.bathrooms || 0}</span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">Baths</span>
                       </div>
                       <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors group">
                          <Maximize className="w-6 h-6 text-slate-400 group-hover:text-blue-600 mb-2 transition-colors" />
                          <span className="font-bold text-slate-900 text-lg">{property.size || property.area}</span>
                          <span className="text-xs text-slate-500 font-bold uppercase tracking-wide">{property.units || "sqft"}</span>
                       </div>
                    </>
                 ) : (
                    <>
                       <div className="col-span-3 bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-between hover:bg-slate-100 transition-colors group">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-blue-600 transition-colors">
                                <LandPlot className="w-6 h-6" />
                             </div>
                             <div>
                                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wide mb-1">Plot Area</span>
                                <span className="block font-bold text-slate-900 text-xl">{property.plotArea || property.area || property.size} {property.units || "Sq Ft"}</span>
                             </div>
                          </div>
                       </div>
                    </>
                 )}
              </div>

              {/* Key Details Grid */}
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-6 text-lg">Property Details</h3>
                 <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Type</div>
                       <div className="font-semibold text-slate-900 capitalize text-base">{property.propertyCategory || "Apartment"}</div>
                    </div>
                    
                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
                       <div className="font-semibold text-slate-900 text-base">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          {property.status || property.availabilityStatus || "Ready to Move"}
                       </div>
                    </div>

                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Project</div>
                       <div className="font-semibold text-slate-900 text-base border-b border-dotted border-slate-400 inline-block pb-0.5">{property.project || property.title}</div>
                    </div>

                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Ownership</div>
                       <div className="font-semibold text-slate-900 text-base">{property.ownership || "Freehold"}</div>
                    </div>

                    {!isLand && (
                       <div>
                          <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Floor</div>
                          <div className="font-semibold text-slate-900 text-base">
                             {property.floorNumber || property.floor || "N/A"} 
                             {property.totalFloors && <span className="text-slate-400 font-normal"> / {property.totalFloors}</span>}
                          </div>
                       </div>
                    )}
                    
                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Furnishing</div>
                       <div className="font-semibold text-slate-900 text-base">{property.furnished || property.furnishingStatus || "Unfurnished"}</div>
                    </div>
                 </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                   <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-2xl border border-blue-100">
                      {property.contactName?.[0] || property.sellerName?.[0] || "O"}
                   </div>
                   <div>
                      <div className="font-bold text-xl text-slate-900">{property.contactName || property.sellerName || "Property Owner"}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-1.5 font-medium">
                         <ShieldCheck className="w-4 h-4 text-green-500" /> 
                         <span>Verified Seller</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                      onClick={handleMessageOwner}
                      className="bg-[#0066FF] hover:bg-blue-600 text-white py-4 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                   >
                      <MessageCircle className="w-6 h-6" />
                      <span>Chat</span>
                   </button>
                   <button 
                      onClick={handleCallOwner}
                      className="bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 py-4 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                   >
                      <Phone className="w-6 h-6" />
                      <span>Call</span>
                   </button>
                </div>
                <div className="text-center text-sm text-slate-400 mt-2 font-medium">
                   Response time: usually within 1 hour
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SIMILAR PROPERTIES SECTIONS */}
        <div className="mt-16 border-t border-slate-200 pt-12">
          {/* Section 1: Nearby */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-2xl font-bold text-slate-900">Other Properties in this Project and Nearby</h2>
               <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
               </button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x">
               {similarProperties.slice(0, 5).map((prop, idx) => (
                  <div 
                    key={prop.id || idx} 
                    onClick={() => router.push(`/property/${prop.id}`)}
                    className="min-w-[300px] md:min-w-[340px] bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer snap-start"
                  >
                     <div className="relative h-56 bg-slate-200 overflow-hidden">
                        <Image 
                           src={prop.images?.[0] || prop.image || "/placeholder.jpg"} 
                           alt={prop.title || "Property"} 
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                           <ImageIcon className="w-3 h-3" />
                           {prop.images?.length || 1}
                        </div>
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-2 py-1 rounded-md">
                           {prop.propertyCategory || "Property"}
                        </div>
                     </div>
                     
                     <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                           {prop.title || `${prop.bedrooms || 3} BHK ${prop.propertyCategory || "Apartment"}`}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3 text-slate-900">
                           <span className="font-bold text-xl">₹{prop.price || "0"} {prop.priceUnit || ""}</span>
                           <span className="text-slate-300">|</span>
                           <span className="font-bold text-lg text-slate-700">{prop.area || prop.size || "0"} {prop.units || "sqft"}</span>
                        </div>
                        
                        <div className="text-sm text-slate-500 mb-4 font-medium flex items-center gap-1">
                           <Building2 className="w-4 h-4 text-slate-400" />
                           {prop.sellerName || prop.contactName || "Property Owner"}
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                              {prop.status || prop.availabilityStatus || "Ready to Move"}
                           </div>
                           <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ArrowRight className="w-4 h-4" />
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
               {similarProperties.length === 0 && (
                  <div className="w-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
                     No similar properties found nearby.
                  </div>
               )}
            </div>
          </div>

          {/* Section 2: People also liked */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">People who viewed this property also liked</h2>
            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x">
               {(similarProperties.length > 5 ? similarProperties.slice(5) : similarProperties.slice(0, 4)).map((prop, idx) => (
                  <div 
                    key={prop.id || idx} 
                    onClick={() => router.push(`/property/${prop.id}`)}
                    className="min-w-[300px] md:min-w-[340px] bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer snap-start"
                  >
                     <div className="relative h-56 bg-slate-200 overflow-hidden">
                        <Image 
                           src={prop.images?.[0] || prop.image || "/placeholder.jpg"} 
                           alt={prop.title || "Property"} 
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                           <ImageIcon className="w-3 h-3" />
                           {prop.images?.length || 1}
                        </div>
                     </div>
                     
                     <div className="p-5">
                        <h3 className="font-bold text-slate-900 text-lg mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                           {prop.title || `${prop.bedrooms || 3} BHK ${prop.propertyCategory || "Apartment"}`}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3 text-slate-900">
                           <span className="font-bold text-xl">₹{prop.price || "0"} {prop.priceUnit || ""}</span>
                           <span className="text-slate-300">|</span>
                           <span className="font-bold text-lg text-slate-700">{prop.area || prop.size || "0"} {prop.units || "sqft"}</span>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                           <div className="text-sm text-slate-500 font-medium">
                              {prop.location || "Location not available"}
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        </div>
      </div>

      </main>
      
      <Footer />

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button 
           onClick={handleMessageOwner}
           className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20"
         >
           Contact
         </button>
         <button 
           onClick={handleCallOwner}
           className="flex-1 border border-slate-200 text-slate-900 bg-white py-3 rounded-xl font-bold text-sm"
         >
           Call
         </button>
      </div>

      {/* Full Screen Image Modal */}
      {showAllPhotos && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 text-white bg-black/50 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAllPhotos(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                   <h3 className="font-bold text-lg">{property.title}</h3>
                   <span className="text-sm text-white/60">{mediaItems.length} Photos</span>
                </div>
             </div>
             <button 
               onClick={() => setShowAllPhotos(false)}
               className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                {mediaItems.map((item, index) => (
                   <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 ring-1 ring-white/10 group">
                      {item.type === 'video' ? (
                         <video src={item.url} controls className="w-full h-full object-cover" />
                      ) : (
                         <Image 
                           src={item.url} 
                           alt={`Property image ${index+1}`}
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
