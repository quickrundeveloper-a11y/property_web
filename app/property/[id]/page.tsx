"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/utils";
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
  Home,
  CheckCircle2,
  ShieldCheck,
  X,
  ImageIcon,
  Eye,
  LandPlot,
  ArrowRight,
  Calendar
} from "lucide-react";

import { Property } from "@/lib/types";
import Breadcrumbs from "@/app/components/Breadcrumbs";

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { openChat } = useChat();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  useEffect(() => {
    const recordView = async () => {
      if (!params.id) return;
      const propertyId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      // Client-side view counting with throttling
      const lastViewKey = `last_view_${propertyId}`;
      const lastViewTime = localStorage.getItem(lastViewKey);
      const now = Date.now();
      
      // 24 hour cooldown (86400000 ms)
      if (lastViewTime && (now - parseInt(lastViewTime)) < 86400000) {
        return;
      }

      try {
        const propertyRef = doc(db, "property_All", "main", "properties", propertyId);
        
        await runTransaction(db, async (transaction) => {
          const propDoc = await transaction.get(propertyRef);
          if (!propDoc.exists()) return;

          const currentViews = propDoc.data().viewCount || 0;
          transaction.update(propertyRef, {
            viewCount: currentViews + 1
          });
        });

        localStorage.setItem(lastViewKey, now.toString());
      } catch (error) {
        console.error('Failed to update view count:', error);
      }
    };

    if (!authLoading) {
      recordView();
    }
  }, [params.id, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!params.id) return;

    // Fetch from Firebase with real-time updates
    const docRef = doc(db, "property_All", "main", "properties", params.id as string);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
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
        setProperty(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching property:", error);
      setLoading(false);
    });

    return () => unsubscribe();
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

  const category = String(property.propertyCategory || "").toLowerCase();
  const isLand = category.includes("land") || category.includes("plot");
  const isPG = property.type === 'pg';
  
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


  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="pb-20 pt-8">
      
      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { 
              label: property.type === 'rent' ? 'Rent' : (property.type === 'pg' ? 'PG/Co-living' : 'Buy'), 
              href: `/home?filter=${property.type === 'rent' ? 'Rent' : (property.type === 'pg' ? 'PG' : 'Buy')}` 
            },
            { 
              label: property.propertyCategory || "Property",
              href: `/home?filter=${property.type === 'rent' ? 'Rent' : (property.type === 'pg' ? 'PG' : 'Buy')}&category=${property.propertyCategory || ''}`
            },
            { 
              label: property.title || "Property Details", 
            }
          ]} 
        />

        {/* TOP SPLIT SECTION: Image Left, Data Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
           
           {/* LEFT: Main Image */}
           <div className="h-[400px] lg:h-[550px] w-full rounded-2xl overflow-hidden relative group cursor-pointer" onClick={() => setShowAllPhotos(true)}>
              <Image 
                 src={images[0] || "/placeholder.jpg"} 
                 alt="Main Property Image" 
                 fill 
                 className="object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
              
              {/* Image Count Badge */}
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-transform group-hover:scale-105 hover:bg-white">
                 <ImageIcon className="w-4 h-4" />
                 View all {images.length} photos
              </div>
           </div>

           {/* RIGHT: Primary Data & Actions */}
           <div className="flex flex-col justify-center">
              
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                 <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                    property.type === 'rent' ? 'bg-purple-50 text-purple-700' : 
                    property.type === 'pg' ? 'bg-orange-50 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                 }`}>
                    {property.type === 'rent' ? 'For Rent' : property.type === 'pg' ? 'PG / Co-living' : 'For Sale'}
                 </span>
                 <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider">
                    {property.propertyCategory || "Property"}
                 </span>
                 <div className="flex items-center gap-1.5 text-slate-500 text-sm px-3 py-1.5 rounded-full border border-slate-100">
                    <Eye className="w-3 h-3" />
                    <span className="font-medium">{property.viewCount || 0} views</span>
                 </div>
              </div>

              {/* Title & Location */}
              <div className="mb-8">
                 <h1 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-4 leading-tight tracking-tight">{property.title}</h1>
                 <div className="flex items-center text-slate-600 text-lg">
                    <MapPin className="w-5 h-5 text-slate-400 mr-2" />
                    {property.location}
                 </div>
              </div>

              {/* Price */}
              <div className="mb-8">
                 <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                       {formatPrice(property.price)}
                    </h2>
                    {(property.type === 'rent' || property.type === 'pg') && <span className="text-xl text-slate-500 font-medium">/month</span>}
                 </div>
                 {/* EMI Section Removed */}
              </div>

              {/* Key Quick Stats (Horizontal, Flat) */}
              <div className="flex flex-wrap gap-8 py-6 mb-8">
                 {!isLand ? (
                    <>
                       <div className="flex items-center gap-3">
                          <Bed className="w-6 h-6 text-slate-400" />
                          <div>
                             <span className="block font-bold text-slate-900 text-lg leading-none">{property.beds || property.bedrooms || 0}</span>
                             <span className="text-sm text-slate-500 font-medium">Beds</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Bath className="w-6 h-6 text-slate-400" />
                          <div>
                             <span className="block font-bold text-slate-900 text-lg leading-none">{property.baths || property.bathrooms || 0}</span>
                             <span className="text-sm text-slate-500 font-medium">{property.propertyType === 'commercial' ? "Washrooms" : "Bathrooms"}</span>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                          <Maximize className="w-6 h-6 text-slate-400" />
                          <div>
                             <span className="block font-bold text-slate-900 text-lg leading-none">{property.size || property.area}</span>
                             <span className="text-sm text-slate-500 font-medium">{property.units || "sqft"}</span>
                          </div>
                       </div>
                    </>
                 ) : (
                    <div className="flex items-center gap-4">
                       <LandPlot className="w-6 h-6 text-slate-400" />
                       <div>
                          <span className="block font-bold text-slate-900 text-lg leading-none">{property.plotArea || property.area || property.size} {property.units || "Sq Ft"}</span>
                          <span className="text-sm text-slate-500 font-medium">Plot Area</span>
                       </div>
                    </div>
                 )}
                 <div className="flex items-center gap-3">
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                    <div>
                       <span className="block font-bold text-slate-900 text-lg leading-none">Verified</span>
                       <span className="text-sm text-slate-500 font-medium">Listing • Response time &lt; 1 hr</span>
                    </div>
                 </div>
              </div>

              {/* Contact Buttons - Flat & Clean */}
              <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={handleMessageOwner}
                    className="bg-[#0085FF] hover:bg-[#006bb3] text-white py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                 >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat</span>
                 </button>
                 <button 
                    onClick={handleCallOwner}
                    className="bg-transparent border border-[#0085FF] text-[#0085FF] hover:bg-blue-50 py-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                 >
                    <Phone className="w-5 h-5" />
                    <span>Call</span>
                 </button>
              </div>
           </div>
        </div>

        {/* BELOW SECTION: Details, Description, etc. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
           
           {/* LEFT CONTENT (8 cols) */}
           <div className="lg:col-span-8 space-y-12">
              
              {/* Property Details Grid - Flat Design */}
              <div>
                 <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Property Details</h3>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
                    {[
                      { label: "Property ID", value: property.id?.slice(0, 8).toUpperCase() },
                      { label: "Type", value: property.propertyCategory || property.type },
                      { label: "Status", value: property.availabilityStatus || property.status },
                      { label: "Project", value: property.project || property.title },
                      { label: "Ownership", value: property.ownership },
                      { label: "Age", value: property.ageOfProperty || property.ageOfConstruction },
                      { label: "Possession", value: property.possessionBy },
                      
                      ...(isLand ? [
                        { label: "Plot Area", value: property.plotArea ? `${property.plotArea} ${property.units || ''}` : null },
                        { label: "Dimensions", value: property.plotLength && property.plotBreadth ? `${property.plotLength} x ${property.plotBreadth} ${property.units || ''}` : null },
                        { label: "Floors Allowed", value: property.floorsAllowed },
                        { label: "Boundary Wall", value: property.boundaryWall },
                        { label: "Open Sides", value: property.openSides },
                        { label: "Construction", value: property.anyConstruction === 'Yes' ? 'Yes' : (property.anyConstruction === 'No' ? 'No' : null) },
                        { label: "Road Facing", value: property.facingRoadWidth ? `${property.facingRoadWidth} ${property.facingRoadUnit || ''}` : null },
                      ] : [
                        { label: "Floor", value: (property.floorNumber || property.floorNumber === 0) ? `${property.floorNumber}${property.totalFloors ? ' of ' + property.totalFloors : ''}` : property.floor },
                        { label: "Furnishing", value: property.furnishingStatus || property.furnished },
                        { label: isPG ? "Room Type" : "Bedrooms", value: property.bedrooms || property.beds },
                        { label: property.propertyType === 'commercial' ? "Washrooms" : "Bathrooms", value: property.bathrooms || property.baths },
                        { label: "Balconies", value: property.balconies },
                        { label: "Parking", value: [
                             property.coveredParking ? `${property.coveredParking} Covered` : null,
                             property.openParking ? `${property.openParking} Open` : null
                           ].filter(Boolean).join(", ") 
                        },
                        { label: "Carpet Area", value: property.area ? `${property.area} ${property.units || ''}` : null },
                        { label: "Other Rooms", value: property.otherRooms?.join(", ") },
                        { label: "Facing", value: property.facing },
                        { label: "Overlooking", value: property.overlooking?.join(", ") },
                        { label: "Flooring", value: property.flooring },
                        { label: "Water Source", value: property.waterSource?.join(", ") },
                        { label: "Power Backup", value: property.powerBackup },
                        { label: "Road Facing", value: property.facingRoadWidth ? `${property.facingRoadWidth} ${property.facingRoadUnit || ''}` : null },
                        { label: "All Inclusive Price", value: property.allInclusivePrice ? "Yes" : null },
                        { label: "Tax Excluded", value: property.taxExcluded ? "Yes" : null },
                        { label: "Negotiable", value: property.priceNegotiable ? "Yes" : null },
                      ])
                    ].filter(item => item.value && item.value !== "0" && item.value !== "").map((item, idx) => (
                       <div key={idx} className="border-b border-slate-100 pb-2">
                          <div className="text-slate-500 text-sm font-medium mb-1">{item.label}</div>
                          <div className="font-semibold text-slate-900 text-base capitalize">{item.value}</div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Description Section */}
              <div>
                 <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">About this property</h3>
                 <div className="prose prose-slate max-w-none text-slate-600">
                    {(() => {
                        const description = String(property.description || property.uniqueDescription || "No description available for this property.");
                        const shouldTruncate = description.length > 300;
                       
                       return (
                          <>
                             <p className="leading-relaxed whitespace-pre-wrap">
                                {shouldTruncate && !isDescriptionExpanded 
                                   ? `${description.slice(0, 300)}...` 
                                   : description}
                             </p>
                             {shouldTruncate && (
                                <button 
                                   onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                   className="mt-2 text-[#0085FF] font-medium hover:underline focus:outline-none"
                                >
                                   {isDescriptionExpanded ? "Show less" : "Show more"}
                                </button>
                             )}
                          </>
                       );
                    })()}
                 </div>
              </div>

              {/* Amenities Section */}
              {((property.features && property.features.length > 0) || (property.amenities && property.amenities.length > 0)) && (
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Amenities & Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {[...(property.features || []), ...(property.amenities || [])].map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-slate-700 font-medium p-3 bg-slate-50 rounded-lg">
                             <CheckCircle2 className="w-4 h-4 text-black" />
                             {feature}
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>

           {/* RIGHT SIDEBAR (4 cols) - Owner Info - Flat */}
           <div className="lg:col-span-4">
              <div className="sticky top-24">
                 <div className="hidden lg:block">
                    <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Listed by</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-xl">
                         {property.OwnerName?.[0] || property.contactName?.[0] || property.sellerName?.[0] || "O"}
                      </div>
                      <div>
                         <div className="font-bold text-lg text-slate-900">{property.OwnerName || property.contactName || property.sellerName || "Property Owner"}</div>
                         <div className="text-sm text-slate-500">{property.userType || "Property Owner"}</div>
                      </div>
                   </div>
                   
                   <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-slate-600">
                         <MapPin className="w-5 h-5 text-slate-400" />
                         <span>{property.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                         <Calendar className="w-5 h-5 text-slate-400" />
                         <span>Listed on {property.createdAt ? new Date(property.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-3">
                      <button 
                        onClick={handleMessageOwner}
                        className="w-full bg-[#0085FF] text-white py-3 rounded-lg font-bold hover:bg-[#006bb3] transition-colors"
                     >
                        Chat
                     </button>
                   </div>
                 </div>
                 
                 {/* Mobile version of owner info */}
                <div className="lg:hidden border-t border-slate-100 pt-8">
                   <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-sm">Listed by</h3>
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 font-bold text-xl">
                         {property.OwnerName?.[0] || property.contactName?.[0] || property.sellerName?.[0] || "O"}
                      </div>
                      <div>
                         <div className="font-bold text-lg text-slate-900">{property.OwnerName || property.contactName || property.sellerName || "Property Owner"}</div>
                         <div className="text-sm text-slate-500">{property.userType || "Property Owner"}</div>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>

      </div>

      {/* SIMILAR PROPERTIES SECTIONS */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-24 pt-12 border-t border-slate-100">
          {/* Section 1: Nearby */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-bold text-slate-900">Other Properties in this Project and Nearby</h2>
               <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                  <ArrowRight className="w-5 h-5 text-slate-600" />
               </button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide snap-x">
               {similarProperties.slice(0, 5).map((prop, idx) => (
                  <div 
                    key={prop.id || idx} 
                    onClick={() => router.push(`/property/${prop.id}`)}
                    className="min-w-[300px] md:min-w-[340px] group cursor-pointer snap-start"
                  >
                     <div className="relative h-64 bg-slate-100 rounded-2xl overflow-hidden mb-4">
                        <Image 
                           src={prop.images?.[0] || prop.image || "/placeholder.jpg"} 
                           alt={prop.title || "Property"} 
                           fill
                           className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full">
                           {prop.propertyCategory || "Property"}
                        </div>
                     </div>
                     
                     <div>
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="font-bold text-slate-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {prop.title || `${prop.bedrooms || 3} BHK ${prop.propertyCategory || "Apartment"}`}
                           </h3>
                           <span className="font-bold text-lg text-slate-900">₹{prop.price || "0"}</span>
                        </div>
                        <div className="text-slate-500 text-sm">
                           {prop.location || "Location not available"}
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
      </div>
      
      </main>
      
      <Footer />

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <button 
           onClick={handleMessageOwner}
           className="flex-1 bg-[#0085FF] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20"
         >
           Chat
         </button>
         <button 
           onClick={handleCallOwner}
           className="flex-1 border border-[#0085FF] text-[#0085FF] bg-white py-3 rounded-xl font-bold text-sm"
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