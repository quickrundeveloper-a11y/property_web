"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, addDoc, deleteDoc, doc, where, serverTimestamp, onSnapshot, setDoc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useChat } from "@/app/context/ChatContext";

import AddPropertyForm from "../components/add-property-form";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Rent");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState("Barcelona, Spain");
  const [moveInDate, setMoveInDate] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set());
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChat();

  const handleSMSClick = async (property: any) => {
    const propertyName = property.title || property.name || "Property";
    const propertyLocation = property.location || property.address || "Location";
    const price = formatPrice(property);
    const propertyId = property.id;
    const sellerId = property.sellerId || property.ownerId || property.userId || null;
    
    if (!propertyId || !sellerId || !user) {
      console.warn("Cannot open chat: Missing details or user session", { propertyId, sellerId, user: !!user });
      if (!user) {
        router.push("/auth");
        return;
      }
      alert("This property owner cannot be contacted at the moment (Missing owner details).");
      return;
    }

    const message = `Hi! I'm interested in ${propertyName} located at ${propertyLocation} priced at ₹${price.toLocaleString("en-IN")}/month. Could you please provide more details about this property?`;

    // Create chat ID using Flutter-compatible logic (sorted UIDs)
    const [uid1, uid2] = [user.uid, sellerId].sort();
    const chatId = `${propertyId}_${uid1}_${uid2}`;

    try {
      await runTransaction(db, async (transaction) => {
        // Use the correct collection path: property_All/main/chats
        const chatRef = doc(db, "property_All", "main", "chats", chatId);
        const chatDoc = await transaction.get(chatRef);

        if (!chatDoc.exists()) {
          const buyerName = user.displayName || "Buyer";
          const sellerName = property.contactName || property.sellerName || "Property Owner";
          
          transaction.set(chatRef, {
            chatId,
            propertyId,
            propertyName,
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
            // Add fields to match the screenshot structure for better compatibility
            buyerId: user.uid,
            buyerName: buyerName,
            sellerId: sellerId,
            sellerName: sellerName,
            participants: [user.uid, sellerId]
          });

          // Also create the first message in the subcollection
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
  };

  // Helper function to format price properly
  const formatPrice = (item: any) => {
    if (!item) return 25000;
    const price = item.price || item.rent || item.cost || 25000;
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : Number(price);
    return isNaN(numPrice) ? 25000 : numPrice;
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use reverse geocoding to get location name
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY`
            );
            const data = await response.json();
            if (data.results && data.results[0]) {
              const locationName = data.results[0].formatted;
              setLocation(locationName);
            }
          } catch (error) {
            // Fallback to coordinates if API fails
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please enter manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Search for location suggestions
  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    // Indian cities and popular locations
    const indianCities = [
      "Mumbai, Maharashtra",
      "Delhi, India", 
      "Bangalore, Karnataka",
      "Hyderabad, Telangana",
      "Chennai, Tamil Nadu",
      "Kolkata, West Bengal",
      "Pune, Maharashtra",
      "Ahmedabad, Gujarat",
      "Jaipur, Rajasthan",
      "Surat, Gujarat",
      "Lucknow, Uttar Pradesh",
      "Kanpur, Uttar Pradesh",
      "Nagpur, Maharashtra",
      "Indore, Madhya Pradesh",
      "Thane, Maharashtra",
      "Bhopal, Madhya Pradesh",
      "Visakhapatnam, Andhra Pradesh",
      "Pimpri-Chinchwad, Maharashtra",
      "Patna, Bihar",
      "Vadodara, Gujarat",
      "Ghaziabad, Uttar Pradesh",
      "Ludhiana, Punjab",
      "Agra, Uttar Pradesh",
      "Nashik, Maharashtra",
      "Faridabad, Haryana",
      "Meerut, Uttar Pradesh",
      "Rajkot, Gujarat",
      "Kalyan-Dombivali, Maharashtra",
      "Vasai-Virar, Maharashtra",
      "Varanasi, Uttar Pradesh",
      "Srinagar, Jammu and Kashmir",
      "Aurangabad, Maharashtra",
      "Dhanbad, Jharkhand",
      "Amritsar, Punjab",
      "Navi Mumbai, Maharashtra",
      "Allahabad, Uttar Pradesh",
      "Ranchi, Jharkhand",
      "Howrah, West Bengal",
      "Coimbatore, Tamil Nadu",
      "Jabalpur, Madhya Pradesh",
      "Gwalior, Madhya Pradesh",
      "Vijayawada, Andhra Pradesh",
      "Jodhpur, Rajasthan",
      "Madurai, Tamil Nadu",
      "Raipur, Chhattisgarh",
      "Kota, Rajasthan",
      "Guwahati, Assam",
      "Chandigarh, India",
      "Solapur, Maharashtra",
      "Hubli-Dharwad, Karnataka",
      "Bareilly, Uttar Pradesh",
      "Moradabad, Uttar Pradesh",
      "Mysore, Karnataka",
      "Gurgaon, Haryana",
      "Aligarh, Uttar Pradesh",
      "Jalandhar, Punjab",
      "Tiruchirappalli, Tamil Nadu",
      "Bhubaneswar, Odisha",
      "Salem, Tamil Nadu",
      "Mira-Bhayandar, Maharashtra",
      "Warangal, Telangana",
      "Thiruvananthapuram, Kerala",
      "Guntur, Andhra Pradesh",
      "Bhiwandi, Maharashtra",
      "Saharanpur, Uttar Pradesh",
      "Gorakhpur, Uttar Pradesh",
      "Bikaner, Rajasthan",
      "Amravati, Maharashtra",
      "Noida, Uttar Pradesh",
      "Jamshedpur, Jharkhand",
      "Bhilai Nagar, Chhattisgarh",
      "Cuttack, Odisha",
      "Firozabad, Uttar Pradesh",
      "Kochi, Kerala",
      "Bhavnagar, Gujarat",
      "Dehradun, Uttarakhand",
      "Durgapur, West Bengal",
      "Asansol, West Bengal",
      "Nanded-Waghala, Maharashtra",
      "Kolhapur, Maharashtra",
      "Ajmer, Rajasthan",
      "Akola, Maharashtra",
      "Gulbarga, Karnataka",
      "Jamnagar, Gujarat",
      "Ujjain, Madhya Pradesh",
      "Loni, Uttar Pradesh",
      "Siliguri, West Bengal",
      "Jhansi, Uttar Pradesh",
      "Ulhasnagar, Maharashtra",
      "Nellore, Andhra Pradesh",
      "Jammu, Jammu and Kashmir",
      "Sangli-Miraj & Kupwad, Maharashtra",
      "Belgaum, Karnataka",
      "Mangalore, Karnataka",
      "Ambattur, Tamil Nadu",
      "Tirunelveli, Tamil Nadu",
      "Malegaon, Maharashtra",
      "Gaya, Bihar",
      "Jalgaon, Maharashtra",
      "Udaipur, Rajasthan",
      "Maheshtala, West Bengal"
    ];

    const filtered = indianCities.filter(city => 
      city.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    setLocationSuggestions(filtered);
  };

  // Handle location input change
  const handleLocationChange = (value: string) => {
    setLocation(value);
    searchLocations(value);
    setShowLocationSuggestions(true);
  };

  // Select location from suggestions
  const selectLocation = (selectedLocation: string) => {
    setLocation(selectedLocation);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  // Load user's favorite properties
  const loadFavorites = async () => {
    if (!user) {
      setFavoriteProperties(new Set());
      return;
    }
    try {
      const favoritesQuery = collection(db, "property_All", "main", "users", user.uid, "favorites");
      const snapshot = await getDocs(favoritesQuery);
      const favoriteIds = new Set(snapshot.docs.map(doc => doc.id));
      setFavoriteProperties(favoriteIds);
      console.log(`Loaded ${favoriteIds.size} favorites from Firebase for user ${user.uid}`);
    } catch (error) {
      console.error("Error loading favorites from Firebase:", error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    // Validate inputs
    if (!propertyId) {
      console.error("Invalid parameters for toggleFavorite");
      return;
    }

    if (!user) {
        router.push("/auth");
        return;
    }
    
    const isFavorite = favoriteProperties.has(propertyId);

    try {
      if (isFavorite) {
        // Remove from favorites
        await deleteDoc(doc(db, "property_All", "main", "users", user.uid, "favorites", propertyId));
        console.log(`Removed property ${propertyId} from Firebase favorites`);
      } else {
        // Add to favorites
        await setDoc(doc(db, "property_All", "main", "users", user.uid, "favorites", propertyId), {
          propertyId: propertyId,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        console.log(`Added property ${propertyId} to Firebase favorites`);
      }
      
      // Update local state
      setFavoriteProperties(prev => {
        const next = new Set(prev);
        if (isFavorite) {
          next.delete(propertyId);
        } else {
          next.add(propertyId);
        }
        return next;
      });
      
    } catch (error) {
      console.error("Firebase error:", error);
    }

    // Show visual feedback
    try {
      const heartButton = e.currentTarget as HTMLElement;
      if (heartButton && heartButton.style) {
        heartButton.style.transform = isFavorite ? 'scale(0.8)' : 'scale(1.2)';
        setTimeout(() => {
          if (heartButton && heartButton.style) {
            heartButton.style.transform = 'scale(1)';
          }
        }, 150);
      }
    } catch (animationError) {
      // Ignore animation errors - they're not critical
      console.log("Animation error (non-critical):", animationError);
    }
  };



  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, "property_All", "main", "properties"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          // Ensure required fields exist
          title: docData.title || docData.name || 'Property',
          location: docData.location || docData.address || 'Location',
          price: docData.price || docData.rent || docData.cost || 25000,
          bedrooms: docData.bedrooms || docData.beds || 3,
          bathrooms: docData.bathrooms || docData.baths || 2,
          area: docData.area || docData.sqft || '5x7',
          priceUnit: docData.priceUnit || docData.price_unit || 'per_month',
          phone: docData.phone || docData.contact || '+91-9876543210',
          images: Array.isArray(docData.images) ? docData.images : (docData.image ? [docData.image] : []),
          image: docData.images?.[0] || docData.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        };
      }).filter(property => property && property.id);

      console.log("Firebase Properties Data:", data);
      console.log("Number of properties found:", data.length);
      
      // Debug: Log each property's image data
      data.forEach((property: any, index: number) => {
        console.log(`Property ${index + 1} (${property.title || property.name || 'Unnamed'}):`, {
          id: property.id,
          images: property.images,
          image: property.image,
          hasImages: !!property.images,
          hasImage: !!property.image,
          imagesLength: property.images?.length || 0,
          firstImage: property.images?.[0] || property.image,
          phone: property.phone,
          contact: property.contact,
          allKeys: Object.keys(property).sort()
        });
      });

      setProperties(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError("Failed to load properties from Firebase");
    } finally {
      setLoading(false);
    }
  };

  const getPriceSuffix = (item: any) => {
    const unit = String(item?.priceUnit || '').toLowerCase();
    if (unit === 'per_year') return '/year';
    if (unit === 'per_sqft') return '/sq ft';
    return '/month';
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    loadFavorites(); // Load user's favorites
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, "property_All", "main", "properties"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProperties(data);
      setLoading(false);
    }, (err) => {
      console.error("Realtime properties error:", err);
      setError("Failed to subscribe to properties");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.location-container')) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8fc]">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-blue-500 to-blue-600 text-white relative overflow-hidden min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              {/* Main Heading */}
              <div className="bg-blue-400/30 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-blue-300/20">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Buy, rent, or sell<br />your property<br />
                  <span className="text-blue-200">easily</span>
                </h1>
                <p className="text-blue-100 text-base lg:text-lg">
                  A great platform to buy, sell, or even rent your properties without any commissions.
                </p>
              </div>

              {/* Action Tabs */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6 border border-white/20">
                <div className="flex flex-wrap gap-2 mb-4 lg:mb-6">
                  <button
                    onClick={() => router.push("/property?type=rent")}
                    className={`px-4 lg:px-6 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                      activeTab === "Rent"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    Rent
                  </button>
                  <button
                    onClick={() => router.push("/property?type=buy")}
                    className={`px-4 lg:px-6 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                      activeTab === "Buy"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => router.push("/property?type=sell")}
                    className={`px-4 lg:px-6 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                      activeTab === "Sell"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    Sell
                  </button>
                  <button
                    onClick={() => router.push("/add-property")}
                    className={`px-4 lg:px-6 py-2 rounded-lg font-medium transition-colors text-sm lg:text-base ${
                      activeTab === "AddProperty"
                        ? "bg-white text-blue-600"
                        : "text-white hover:bg-white/20"
                    }`}
                  >
                    Add Property
                  </button>
                  {activeTab !== "AddProperty" && (
                  <button 
                    onClick={() => {
                      const searchParams = new URLSearchParams();
                      // Only include location if it's not the default value
                      if (location && location !== "Barcelona, Spain") {
                        searchParams.set('location', location);
                      }
                      if (moveInDate) searchParams.set('date', moveInDate);
                      if (activeTab) searchParams.set('type', activeTab.toLowerCase());
                      
                      router.push(`/property?${searchParams.toString()}`);
                    }}
                    className="bg-blue-700 text-white px-4 lg:px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors text-sm lg:text-base w-full sm:w-auto"
                  >
                    Browse Properties
                  </button>
                  )}
                </div>

                {/* Location and Date Inputs */}
                {activeTab === "AddProperty" ? (
                  <AddPropertyForm defaultType="sell" onSuccess={() => {
                    setActiveTab("Rent");
                    fetchProperties();
                  }} />
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative location-container">
                    <label className="block text-white/80 text-sm mb-2">Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        onFocus={() => setShowLocationSuggestions(true)}
                        placeholder="Enter city or area"
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 pr-10 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm lg:text-base"
                      />
                      <button
                        onClick={getCurrentLocation}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        title="Use current location"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Location Suggestions */}
                    {showLocationSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-48 overflow-y-auto">
                        {locationSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectLocation(suggestion)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800 text-sm border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {suggestion}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-white/80 text-sm mb-2">When</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 lg:px-4 py-2 lg:py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm lg:text-base [color-scheme:dark]"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-2 lg:mb-3 border border-white/20">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xl lg:text-2xl font-bold">50k+ renters</div>
                  <div className="text-blue-200 text-xs lg:text-sm">believe in our service</div>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-full w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center mx-auto mb-2 lg:mb-3 border border-white/20">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div className="text-xl lg:text-2xl font-bold">10k+ properties</div>
                  <div className="text-blue-200 text-xs lg:text-sm">and house ready for occupancy</div>
                </div>
              </div>
            </div>

            {/* Right Side - House Image */}
            <div className="relative order-1 lg:order-2">
              <img
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                alt="Beautiful House"
                className="rounded-2xl shadow-2xl w-full h-64 sm:h-80 lg:h-96 object-cover"
              />
              {/* Excellent Rating Badge */}
              <div className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 bg-gray-900/90 backdrop-blur-sm text-white p-3 lg:p-4 rounded-xl border border-white/10">
                <div className="text-base lg:text-lg font-semibold mb-1">Excellent</div>
                <div className="flex space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-3 h-3 lg:w-4 lg:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="text-xs text-gray-300">From 3,204 reviews</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FEATURES SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Property Insurance */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Property Insurance</h3>
              <p className="text-gray-600 text-sm">We offer our customer property protection of liability coverage and insurance for their better life.</p>
            </div>

            {/* Best Price */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Best Price</h3>
              <p className="text-gray-600 text-sm">Not sure what you should be charging for your property? No need to worry, let us do the numbers for you.</p>
            </div>

            {/* Lowest Commission */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Lowest Commission</h3>
              <p className="text-gray-600 text-sm">You no longer have to negotiate commissions and haggle with other agents it only cost 2%!</p>
            </div>

            {/* Overall Control */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Overall Control</h3>
              <p className="text-gray-600 text-sm">Get a virtual tour, and schedule visits before you rent or buy any properties. You get overall control.</p>
            </div>
          </div>
        </div>
      </section>
      {/* PROPERTY GRID */}
      <section className="max-w-6xl mx-auto px-14 py-12">
        <h2 className="text-3xl font-bold text-center">Based on your location</h2>
        <p className="text-center text-gray-500 mt-2">Some of our picked properties near your location</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 mt-10">
          {loading ? (
            // Loading State
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties from Firebase...</p>
            </div>
          ) : error ? (
            // Error State - Show default property
            <>
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
                    className="h-48 w-full object-cover rounded-t-xl"
                    alt="Amarpali Zodiac"
                  />
                  <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium">
                    apartment
                  </div>
                  <button 
                    onClick={(e) => {
                      try {
                        toggleFavorite('sample-property', e);
                      } catch (error) {
                        console.error("Error in heart button click:", error);
                      }
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm ${
                      favoriteProperties.has('sample-property')
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                    title={favoriteProperties.has('sample-property') ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-5 h-5" fill={favoriteProperties.has('sample-property') ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-600 font-bold text-xl">
                      ₹30,00,000
                      <span className="text-gray-400 text-sm font-normal"> /month</span>
                    </p>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg mb-1">Amarpali Zodiac</h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    sector-122
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 border-t border-gray-100 pt-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      4 Beds
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      2 Baths
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 000 2v9a2 2 0 002 2h6a2 2 0 002-2V6a1 1 0 100-2H3zm6 2a1 1 0 00-1 1v6a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      1999 sq ft
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      +91-9876543210
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = "tel:+91-9876543210";
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        Call
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const sampleProperty = {
                            id: 'sample-property',
                            title: 'Amarpali Zodiac',
                            location: 'sector-122',
                            price: 3000000,
                            phone: '+91-9876543210',
                            sellerId: 'sample-seller'
                          };
                          handleSMSClick(sampleProperty);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Send SMS"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-full text-center py-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <p className="text-red-600 mb-2">{error}</p>
                  <p className="text-gray-600">Showing sample property above</p>
                </div>
              </div>
            </>
          ) : properties.length > 0 ? (
            // Dynamic Properties from Firebase
            properties.filter(property => property && property.id).map((property, index) => (
              <div 
                key={property.id} 
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                <div className="relative">
                  <img
                    src={property.images?.[0] || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                    className="h-48 w-full object-cover"
                    alt={property.title || property.name || "Property"}
                  />
                  
                  {/* POPULAR Badge for first 3 properties */}
                  {index < 3 && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      POPULAR
                    </div>
                  )}
                  
                  {/* Heart Icon */}
                  <button 
                    onClick={(e) => {
                      try {
                        toggleFavorite(property.id, e);
                      } catch (error) {
                        console.error("Error in heart button click:", error);
                      }
                    }}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-sm ${
                      favoriteProperties.has(property.id)
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
                    }`}
                    title={favoriteProperties.has(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <svg className="w-4 h-4" fill={favoriteProperties.has(property.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-blue-600 font-bold text-lg">
                      ₹{formatPrice(property).toLocaleString("en-IN")}
                      <span className="text-gray-400 text-sm font-normal">{getPriceSuffix(property)}</span>
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
                    {String(property.propertyCategory || property.category || "").toLowerCase() !== "land" && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      {property.bedrooms || property.beds || 3} Beds
                    </div>
                    )}
                    {String(property.propertyCategory || property.category || "").toLowerCase() !== "land" && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      {property.bathrooms || property.baths || 2} Bathrooms
                    </div>
                    )}
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
                      {/* Debug: Show what values we have */}
                      <span title={`Debug: phone="${property.phone}", contact="${property.contact}"`}>
                        {property.phone || property.contact || "+91-9876543210"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const phoneNumber = property.phone || property.contact || "+91-9876543210";
                          window.location.href = `tel:${phoneNumber}`;
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        Call
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSMSClick(property);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
                        title="Send SMS"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // No Properties State
            <div className="col-span-full text-center py-12">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-gray-600 mb-2">No properties found</p>
                <p className="text-gray-500 text-sm">Check back later for new listings</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Browse More Properties Button */}
        <div className="text-center mt-12">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
            Browse more properties
          </button>
        </div>
      </section>

      {/* NEW FEATURES SECTION */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left Side - Feature Cards */}
            <div className="grid gap-6">
              {/* Virtual Home Tour Card */}
              <div className="bg-blue-500/30 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Virtual home tour</h3>
                    <p className="text-blue-100">You can communicate directly with landlords and we provide you with virtual tour before you buy or rent the property.</p>
                  </div>
                </div>
              </div>

              {/* Get Ready to Apply Card */}
              <div className="bg-blue-500/30 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Get ready to apply</h3>
                    <p className="text-blue-100">Find your dream house? You just need to do a little to no effort and you can start move in to your new dream home!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Content */}
            <div>
              <h2 className="text-4xl font-bold mb-6">
                We make it easy for <span className="text-blue-200">tenants</span> and <span className="text-blue-200">landlords</span>.
              </h2>
              <p className="text-blue-100 text-lg mb-8">
                Whether it’s selling your current home, getting financing, or buying a new home, we make it easy and efficient. The best part? you’ll save a bunch of money and time with our services.
              </p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="border-r border-blue-400/30 last:border-r-0">
              <div className="text-4xl font-bold mb-2">7.4%</div>
              <div className="text-blue-200">Property Return Rate</div>
            </div>
            <div className="border-r border-blue-400/30 last:border-r-0">
              <div className="text-4xl font-bold mb-2">3,856</div>
              <div className="text-blue-200">Property in Sell & Rent</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2,540</div>
              <div className="text-blue-200">Daily Completed Transactions</div>
            </div>
          </div>
        </div>
      </section>

      {/* NO SPAM PROMISE SECTION */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-4">
            <span className="text-blue-600 font-medium text-sm">No Spam Promise</span>
          </div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Are you a landlord?
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Discover ways to increase your home's value and get listed. No Spam.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
              Submit
            </button>
          </div>
          
          <p className="text-gray-500 text-sm">
            Join <span className="font-semibold">10,000+</span> other landlords in our Primenivaas community.
          </p>
        </div>
      </section>

      {/* Floating SMS Widget */}
    </div>
  );
}
