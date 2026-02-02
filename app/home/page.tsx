"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc, serverTimestamp, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Property } from "@/lib/types";
import Image from "next/image";
import { Users, Key, Building2, Search as SearchIcon, Home as HomeIcon, ShieldCheck, CircleDollarSign, Percent, BadgePercent, DollarSign, Scan, Sparkles, Bed, Bath, Square, Heart, X, ChevronDown, Check } from "lucide-react";

import AddPropertyForm from "../components/add-property-form";

const PROPERTY_TYPES = [
  "Flat/Apartment",
  "Independent/Builder Floor",
  "Independent House/Villa",
  "Residential Land",
  "1 RK/Studio Apartment",
  "Farm House",
  "Serviced Apartments",
  "Other"
];

const BUDGET_RANGES = ["5 Lac", "10 Lac", "20 Lac", "30 Lac", "40 Lac", "50 Lac", "60 Lac", "70 Lac", "80 Lac", "90 Lac", "1 Cr", "2 Cr", "5 Cr", "10 Cr"];
const BEDROOM_OPTIONS = ["1 RK/1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK"];
const BATHROOM_OPTIONS = ["1", "2", "3", "4+"];
const BALCONY_OPTIONS = ["0", "1", "2", "3+"];
const CONSTRUCTION_STATUS = ["New Launch", "Under Construction", "Ready to Move"];
const POSTED_BY = ["Owner", "Dealer", "Builder"];

function HomeContentInner() {
  const [activeTab, setActiveTab] = useState("Buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState("Property Types");
  const [tempFilters, setTempFilters] = useState({
    propertyTypes: [] as string[],
    minBudget: "",
    maxBudget: "",
    bedroom: [] as string[],
    bathroom: [] as string[],
    balcony: [] as string[],
    constructionStatus: [] as string[],
    postedBy: [] as string[]
  });
  const [appliedFilters, setAppliedFilters] = useState({
    propertyTypes: [] as string[],
    minBudget: "",
    maxBudget: "",
    bedroom: [] as string[],
    bathroom: [] as string[],
    balcony: [] as string[],
    constructionStatus: [] as string[],
    postedBy: [] as string[]
  });
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteProperties, setFavoriteProperties] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(6);
  const propertyGridRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const handleFilterChange = (category: keyof typeof tempFilters, value: string) => {
    setTempFilters(prev => {
      // Handle array types (propertyTypes, constructionStatus, postedBy)
      if (Array.isArray(prev[category])) {
        const currentList = prev[category] as string[];
        if (currentList.includes(value)) {
          return { ...prev, [category]: currentList.filter(item => item !== value) };
        } else {
          return { ...prev, [category]: [...currentList, value] };
        }
      }
      return prev;
    });
  };

  const handleBudgetChange = (type: 'min' | 'max', value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minBudget' : 'maxBudget']: value
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setShowFilters(false);
  };

  const cancelFilters = () => {
    setTempFilters(appliedFilters);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setTempFilters({
      propertyTypes: [],
      minBudget: "",
      maxBudget: "",
      bedroom: [],
      bathroom: [],
      balcony: [],
      constructionStatus: [],
      postedBy: []
    });
  };

  useEffect(() => {
    setVisibleCount(6);
  }, [activeTab]);

  useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter && ["Rent", "Buy", "Sell"].includes(filter)) {
      // Use a slightly longer timeout to ensure page load/rendering
      setTimeout(() => {
        scrollToFilter(filter);
      }, 500);
    }
  }, [searchParams]);

  const router = useRouter();
  const { user } = useAuth();

  const scrollToFilter = (tab?: string) => {
    if (tab) setActiveTab(tab);
    // Add a small delay to ensure state update has processed if needed, though usually not strictly necessary for scrolling
    setTimeout(() => {
      propertyGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Helper function to format price properly
  const formatPrice = (item: Property) => {
    if (!item) return 25000;
    const price = item.price || item.rent || item.cost || 25000;
    const numPrice = typeof price === 'string' ? parseInt(price.replace(/[^\d]/g, '')) : Number(price);
    return isNaN(numPrice) ? 25000 : numPrice;
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
      
    } catch (error: unknown) {
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
    } catch (animationError: unknown) {
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
      data.forEach((property: Property, index: number) => {
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
    } catch (error: unknown) {
      console.error("Error fetching properties:", error);
      setError("Failed to load properties from Firebase");
    } finally {
      setLoading(false);
    }
  };

  const getPriceSuffix = (item: Property) => {
    const unit = String(item?.priceUnit || '').toLowerCase();
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

    const rawType = String(item?.type || item?.propertyType || '').toLowerCase();
    const cat = String(item?.propertyCategory || item?.category || '').toLowerCase();
    
    // Check for explicit sale indicators first
    const isSale = rawType.includes('sell') || rawType.includes('sale') || rawType.includes('buy');
    
    // Only consider it rent if it's NOT explicitly sale, AND has rent indicators
    const isRent = !isSale && (rawType === 'rent' || rawType === 'pg' || unit === 'per_month' || unit === 'per_year');
    
    const isPlot = cat.includes('land') || cat.includes('plot') || rawType.includes('plot');

    if (isRent) {
      return map[unit] || '/month';
    }

    if (isPlot) {
      return map[unit] || '';
    }

    return '';
  };

  const isPlotType = (item: Property) => {
    const cat = String(item?.propertyCategory || item?.category || '').toLowerCase();
    const t = String(item?.type || item?.propertyType || '').toLowerCase();
    return cat.includes('land') || cat.includes('plot') || t.includes('plot');
  };

  const matchesActiveType = (item: Property) => {
    if (activeTab === 'Buy') return true; // Buy shows both Rent and Sell (All)

    const unit = String(item?.priceUnit || '').toLowerCase();
    const rawType = String(item?.type || item?.propertyType || item?.propertyCategory || item?.category || '').toLowerCase();
    
    const isPlot = isPlotType(item);
    
    const isExplicitSale = rawType.includes('buy') || rawType.includes('sale') || rawType.includes('sell');
    
    const isRent = !isExplicitSale && (unit === 'per_month' || unit === 'per_year' || rawType.includes('rent'));
    const isSale = isExplicitSale || isPlot || ['per_sqft', 'per_sqm', 'per_acre', 'per_bigha', 'per_katha', 'per_gaj'].includes(unit);

    if (activeTab === 'Rent') return isRent;
    if (activeTab === 'Sell') return isSale;
    
    return true;
  };

  const getAreaUnitLabel = (item: Property) => {
    const unit = String(item.units || item.areaUnit || item.area_unit || '').toLowerCase();
    if (unit) {
      const map: Record<string, string> = {
        sqft: 'sq ft',
        sqm: 'sq m',
        sqyards: 'sq yards',
        acres: 'acres',
        marla: 'marla',
        cents: 'cents',
        bigha: 'bigha',
        kottah: 'kottah',
        kanal: 'kanal',
        grounds: 'grounds',
        ares: 'ares',
        biswa: 'biswa',
        guntha: 'guntha',
        aankadam: 'aankadam',
        hectares: 'hectares',
        rood: 'rood',
        chataks: 'chataks',
        perch: 'perch'
      };
      return map[unit] || unit;
    }
    return 'sq ft';
  };
  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
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
    loadFavorites();
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

  const parseBudget = (budgetStr: string) => {
    if (!budgetStr) return 0;
    const cleanStr = budgetStr.toLowerCase().replace(/,/g, '');
    if (cleanStr.includes('lac')) {
      return parseFloat(cleanStr) * 100000;
    }
    if (cleanStr.includes('cr')) {
      return parseFloat(cleanStr) * 10000000;
    }
    return parseFloat(cleanStr) || 0;
  };

  const filteredProperties = properties.filter(property => {
    if (!property || !property.id) return false;
    if (!matchesActiveType(property)) return false;
    
    // Apply Advanced Filters
    if (appliedFilters.propertyTypes.length > 0) {
      const pType = (property.type || property.propertyType || '').toLowerCase();
      const matchesType = appliedFilters.propertyTypes.some(filterType => {
        if (filterType === "Flat/Apartment") return pType.includes('flat') || pType.includes('apartment');
        if (filterType === "Independent/Builder Floor") return pType.includes('builder') || pType.includes('floor');
        if (filterType === "Independent House/Villa") return pType.includes('house') || pType.includes('villa');
        if (filterType === "Residential Land") return pType.includes('land') || pType.includes('plot');
        if (filterType === "1 RK/Studio Apartment") return pType.includes('1 rk') || pType.includes('studio');
        if (filterType === "Farm House") return pType.includes('farm');
        if (filterType === "Serviced Apartments") return pType.includes('serviced');
        return pType.includes(filterType.toLowerCase());
      });
      if (!matchesType) return false;
    }

    if (appliedFilters.minBudget) {
      const min = parseBudget(appliedFilters.minBudget);
      if (formatPrice(property) < min) return false;
    }

    if (appliedFilters.maxBudget) {
      const max = parseBudget(appliedFilters.maxBudget);
      if (formatPrice(property) > max) return false;
    }

    if (appliedFilters.bedroom.length > 0) {
      const beds = property.bedrooms || property.beds || 0;
      const matchesBedroom = appliedFilters.bedroom.some(b => {
        if (b === "1 RK/1 BHK") return beds === 1;
        if (b === "2 BHK") return beds === 2;
        if (b === "3 BHK") return beds === 3;
        if (b === "4 BHK") return beds === 4;
        if (b === "4+ BHK") return beds > 4;
        return false;
      });
      if (!matchesBedroom) return false;
    }
    
    if (appliedFilters.bathroom.length > 0) {
      const baths = Number(property.bathrooms || property.baths || 0);
      const matchesBathroom = appliedFilters.bathroom.some(b => {
        if (b === "1") return baths === 1;
        if (b === "2") return baths === 2;
        if (b === "3") return baths === 3;
        if (b === "4+") return baths >= 4;
        return false;
      });
      if (!matchesBathroom) return false;
    }
    
    if (appliedFilters.balcony.length > 0) {
      const balcRaw = property.balconies || 0;
      const balc = typeof balcRaw === 'string' ? parseInt(balcRaw.replace(/[^\d]/g, '')) : Number(balcRaw);
      const matchesBalcony = appliedFilters.balcony.some(b => {
        if (b === "0") return balc === 0;
        if (b === "1") return balc === 1;
        if (b === "2") return balc === 2;
        if (b === "3+") return balc >= 3;
        return false;
      });
      if (!matchesBalcony) return false;
    }
    
    if (appliedFilters.constructionStatus.length > 0) {
      const status = (property.constructionStatus || property.status || '').toLowerCase();
      const matchesStatus = appliedFilters.constructionStatus.some(s => status.includes(s.toLowerCase()));
      if (!matchesStatus) return false;
    }

    if (appliedFilters.postedBy.length > 0) {
      const posted = (property.postedBy || property.userType || '').toLowerCase();
      const matchesPosted = appliedFilters.postedBy.some(p => posted.includes(p.toLowerCase()));
      if (!matchesPosted) return false;
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const title = (property.title || property.name || '').toLowerCase();
      const location = (property.location || property.address || '').toLowerCase();
      const price = (property.price || property.rent || property.cost || '').toString();
      const type = (property.type || property.propertyType || '').toLowerCase();
      
      return title.includes(q) || location.includes(q) || price.includes(q) || type.includes(q);
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f4f8fc]">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-[#0085FF] via-[#0085FF] via-50% to-[#0085FF]/0 text-white relative overflow-hidden min-h-[calc(100vh-64px)] flex flex-col lg:flex-row items-center">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:py-20 w-full relative z-10 order-2 lg:order-1">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6 lg:space-y-8 flex flex-col items-center lg:items-start text-center lg:text-left">
              {/* Main Heading */}
              <div className="mb-6 lg:mb-8">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-[#000929]">
                  Buy, rent, or Sell Property<br />
                  easily
                </h1>
                <p className="text-black text-base lg:text-lg max-w-lg mx-auto lg:mx-0">
                  A great platform to buy, sell property, or even rent without any commissions.
                </p>
              </div>

              {/* Action Tabs & Button */}
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-6 lg:gap-12 w-full lg:w-auto">
                {/* Tabs Container */}
                <div className="bg-white rounded-lg p-1 flex flex-wrap justify-center items-center shadow-sm w-full lg:w-auto">
                  <button
                    onClick={() => scrollToFilter("Rent")}
                    className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 rounded-md text-sm lg:text-base font-semibold transition-all whitespace-nowrap ${
                      activeTab === "Rent"
                        ? "text-[#0085FF] bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Rent
                  </button>
                  <button
                    onClick={() => scrollToFilter("Buy")}
                    className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 rounded-md text-sm lg:text-base font-semibold transition-all whitespace-nowrap ${
                      activeTab === "Buy"
                        ? "text-[#0085FF] bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => scrollToFilter("Sell")}
                    className={`flex-1 lg:flex-none px-4 lg:px-6 py-2.5 rounded-md text-sm lg:text-base font-semibold transition-all whitespace-nowrap ${
                      activeTab === "Sell"
                        ? "text-[#0085FF] bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Sell Property
                  </button>
                </div>

                {/* Search Component */}
                <div className="relative w-full lg:w-80">
                  <div className="bg-[#E0EAFF] rounded-xl flex items-center px-4 py-2.5 transition-all relative z-50">
                    <SearchIcon className="w-5 h-5 text-[#0066FF] mr-3" />
                    <input
                      type="text"
                      value={searchQuery || ""}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowFilters(true)}
                      placeholder="Search property, location, price..."
                      className="bg-transparent border-none focus:ring-0 outline-none text-gray-700 placeholder-gray-500 w-full text-sm font-medium p-0"
                    />
                  </div>

                  {/* Filter Overlay */}
                  {showFilters && (
                    <div className="absolute top-[120%] left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-[90vw] md:w-[800px] bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] p-6 animate-in fade-in zoom-in-95 duration-200">
                      
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 font-medium">Filters</span>
                          <button onClick={clearAllFilters} className="text-[#0066FF] text-sm font-bold hover:underline">
                            Clear all filters
                          </button>
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                        {/* Property Types */}
                        <button 
                          onClick={() => setActiveFilterCategory("Property Types")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Property Types" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Property Types({PROPERTY_TYPES.length})
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Property Types" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Budget */}
                        <button 
                          onClick={() => setActiveFilterCategory("Budget")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Budget" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Budget
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Budget" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Bedroom */}
                        <button 
                          onClick={() => setActiveFilterCategory("Bedroom")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Bedroom" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Bedroom
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Bedroom" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Bathrooms */}
                        <button 
                          onClick={() => setActiveFilterCategory("Bathrooms")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Bathrooms" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Bathrooms
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Bathrooms" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Balconies */}
                        <button 
                          onClick={() => setActiveFilterCategory("Balconies")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Balconies" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Balconies
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Balconies" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Construction Status */}
                        <button 
                          onClick={() => setActiveFilterCategory("Construction Status")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Construction Status" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Construction Status
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Construction Status" ? "rotate-180" : ""}`} />
                        </button>
                        
                        {/* Posted By */}
                        <button 
                          onClick={() => setActiveFilterCategory("Posted By")}
                          className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                            activeFilterCategory === "Posted By" 
                            ? "bg-blue-50 border-blue-200 text-[#0066FF]" 
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          Posted By
                          <ChevronDown className={`w-4 h-4 transition-transform ${activeFilterCategory === "Posted By" ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Content Area */}
                      <div className="min-h-[300px] mb-6">
                        {activeFilterCategory === "Property Types" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {PROPERTY_TYPES.map(type => (
                              <label key={type} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${tempFilters.propertyTypes.includes(type) ? 'bg-[#0066FF] border-[#0066FF]' : 'border-gray-300 bg-white'}`}>
                                  {tempFilters.propertyTypes.includes(type) && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input 
                                  type="checkbox" 
                                  checked={tempFilters.propertyTypes.includes(type)}
                                  onChange={() => handleFilterChange('propertyTypes', type)}
                                  className="hidden"
                                />
                                <span className="text-sm text-gray-700 group-hover:text-[#0066FF] font-medium">{type}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {activeFilterCategory === "Budget" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Select Price Range</h4>
                            <div className="flex gap-4 items-center max-w-lg">
                              <div className="relative w-full">
                                <select 
                                  value={tempFilters.minBudget}
                                  onChange={(e) => handleBudgetChange('min', e.target.value)}
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                >
                                  <option value="">Min Budget</option>
                                  {BUDGET_RANGES.map(b => <option key={`min-${b}`} value={b}>{b}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                              <span className="text-gray-400 font-medium">to</span>
                              <div className="relative w-full">
                                <select 
                                  value={tempFilters.maxBudget}
                                  onChange={(e) => handleBudgetChange('max', e.target.value)}
                                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 outline-none appearance-none cursor-pointer"
                                >
                                  <option value="">Max Budget</option>
                                  {BUDGET_RANGES.map(b => <option key={`max-${b}`} value={b}>{b}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeFilterCategory === "Bedroom" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Number of Bedrooms</h4>
                            <div className="flex flex-wrap gap-3">
                              {BEDROOM_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => handleFilterChange('bedroom', opt)}
                                  className={`px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                    tempFilters.bedroom.includes(opt)
                                    ? "bg-blue-50 border-blue-200 text-[#0066FF]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {tempFilters.bedroom.includes(opt) ? "✓ " : "+ "}{opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activeFilterCategory === "Bathrooms" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Number of Bathrooms</h4>
                            <div className="flex flex-wrap gap-3">
                              {BATHROOM_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => handleFilterChange('bathroom', opt)}
                                  className={`px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                    tempFilters.bathroom.includes(opt)
                                    ? "bg-blue-50 border-blue-200 text-[#0066FF]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {tempFilters.bathroom.includes(opt) ? "✓ " : "+ "}{opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activeFilterCategory === "Balconies" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Number of Balconies</h4>
                            <div className="flex flex-wrap gap-3">
                              {BALCONY_OPTIONS.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => handleFilterChange('balcony', opt)}
                                  className={`px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                    tempFilters.balcony.includes(opt)
                                    ? "bg-blue-50 border-blue-200 text-[#0066FF]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {tempFilters.balcony.includes(opt) ? "✓ " : "+ "}{opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeFilterCategory === "Construction Status" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Construction Status</h4>
                            <div className="flex flex-wrap gap-3">
                              {CONSTRUCTION_STATUS.map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleFilterChange('constructionStatus', status)}
                                  className={`px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                    tempFilters.constructionStatus.includes(status)
                                    ? "bg-blue-50 border-blue-200 text-[#0066FF]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {tempFilters.constructionStatus.includes(status) ? "✓ " : "+ "}{status}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeFilterCategory === "Posted By" && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Posted By</h4>
                            <div className="flex flex-wrap gap-3">
                              {POSTED_BY.map(poster => (
                                <button
                                  key={poster}
                                  onClick={() => handleFilterChange('postedBy', poster)}
                                  className={`px-6 py-2.5 rounded-full border text-sm font-medium transition-all ${
                                    tempFilters.postedBy.includes(poster)
                                    ? "bg-blue-50 border-blue-200 text-[#0066FF]"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                  }`}
                                >
                                  {tempFilters.postedBy.includes(poster) ? "✓ " : "+ "}{poster}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-6 border-t border-gray-100">
                        <div className="mb-6">
                          <a href="#" className="text-[#0066FF] text-sm hover:underline font-medium inline-flex items-center gap-1 group">
                            Looking for commercial properties? Click here
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </a>
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={cancelFilters}
                            className="text-[#0066FF] font-bold px-6 py-3 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={applyFilters}
                            className="bg-[#0066FF] hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all ml-auto"
                          >
                            Search
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                  {/* Backdrop */}
                  {showFilters && (
                    <div 
                      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[90]" 
                      onClick={cancelFilters}
                    />
                  )}
                </div>

                {/* Browse Properties Button */}
                <button
                  onClick={() => scrollToFilter("Buy")}
                  className="bg-[#0085FF] hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all text-sm lg:text-base"
                >
                  Browse Properties
                </button>
              </div>

              {activeTab === "AddProperty" && (
                <AddPropertyForm defaultType="sell" onSuccess={() => {
                  setActiveTab("Rent");
                  fetchProperties();
                }} />
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-12 lg:gap-24 mt-20">
                <div className="flex flex-col gap-6 items-center lg:items-start">
                   <div className="relative w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/80 bg-white/20">
                     <Users className="w-6 h-6 text-white" />
                     <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                        <Key className="w-3 h-3 text-white" />
                     </div>
                   </div>
                   <div>
                     <div className="text-[#0085FF] font-bold text-2xl">50k+ renters</div>
                     <div className="text-[#000929] text-sm font-medium">believe in our service</div>
                   </div>
                </div>
                
                <div className="flex flex-col gap-6 items-center lg:items-start">
                   <div className="relative w-14 h-14 flex items-center justify-center rounded-full border-2 border-white/80 bg-white/20">
                     <Building2 className="w-6 h-6 text-white" />
                     <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                        <SearchIcon className="w-3 h-3 text-white" />
                     </div>
                   </div>
                   <div>
                     <div className="text-[#0085FF] font-bold text-2xl">10k+ properties</div>
                     <div className="text-[#000929] text-sm font-medium">and house ready for occupancy</div>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Empty column for grid spacing on desktop */}
            <div className="hidden lg:block"></div>
          </div>
        </div>
        
        {/* Right Side - House Image (Absolute on Desktop) */}
        <div className="hidden lg:block lg:absolute lg:bottom-0 lg:right-0 lg:w-[38%] lg:h-[98%] lg:order-2 z-0 overflow-hidden">
          <Image
            src="/banner.png"
            alt="Beautiful House"
            fill
            priority
            className="object-cover object-[15%_100%]"
            sizes="(min-width: 1024px) 38vw, 100vw"
          />
          {/* Excellent Rating Badge */}
          <div className="absolute bottom-0 right-0 bg-[#000929] text-white p-4 rounded-tl-lg min-w-[200px]">
            <div className="text-lg font-bold mb-1">Excellent</div>
            <div className="flex space-x-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-white">From 3,264 reviews</div>
          </div>
        </div>
      </section>
      {/* FEATURES SECTION */}
      <section className="py-20 bg-[#F5F9FF]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Property Insurance */}
            <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-white border-4 border-[#E6F0FF] mx-auto lg:mx-0">
                <HomeIcon className="w-8 h-8 text-[#0085FF]" />
                <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                   <ShieldCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#000929]">Property Insurance</h3>
              <p className="text-[#000929]/60 text-sm leading-relaxed">We offer our customer property protection of liability coverage and insurance for their better life.</p>
            </div>

            {/* Best Price */}
            <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-white border-4 border-[#E6F0FF] mx-auto lg:mx-0">
                <CircleDollarSign className="w-8 h-8 text-[#0085FF]" />
                <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                   <Percent className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#000929]">Best Price</h3>
              <p className="text-[#000929]/60 text-sm leading-relaxed">Not sure what you should be charging for your property? No need to worry, let us do the numbers for you.</p>
            </div>

            {/* Lowest Commission */}
            <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-white border-4 border-[#E6F0FF] mx-auto lg:mx-0">
                <BadgePercent className="w-8 h-8 text-[#0085FF]" />
                <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                   <DollarSign className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#000929]">Lowest Commission</h3>
              <p className="text-[#000929]/60 text-sm leading-relaxed">You no longer have to negotiate commissions and haggle with other agents it only cost 2%!</p>
            </div>

            {/* Overall Control */}
            <div className="flex flex-col gap-4 items-center text-center lg:items-start lg:text-left">
              <div className="relative w-16 h-16 flex items-center justify-center rounded-full bg-white border-4 border-[#E6F0FF] mx-auto lg:mx-0">
                <Scan className="w-8 h-8 text-[#0085FF]" />
                <div className="absolute -bottom-1 -right-1 bg-[#0085FF] p-1.5 rounded-full border-2 border-white">
                   <HomeIcon className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#000929]">Overall Control</h3>
              <p className="text-[#000929]/60 text-sm leading-relaxed">Get a virtual tour, and schedule visits before you rent or buy any properties. You get overall control.</p>
            </div>
          </div>
        </div>
      </section>
      {/* PROPERTY GRID */}
      <section ref={propertyGridRef} className="max-w-6xl mx-auto px-6 py-16 bg-[#F8F9FC]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#000929] mb-3">Based on your location</h2>
          <p className="text-gray-500 text-lg">Some of our picked properties near your location.</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          {/* Filter Tabs - Left */}
          <div className="bg-[#E0EAFF] p-1.5 rounded-xl flex flex-wrap justify-center items-center gap-1">
            {[
              { id: "Rent", label: "Rent" },
              { id: "Buy", label: "Buy" },
              { id: "Sell", label: "Sell Property" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white text-[#0066FF] shadow-sm"
                    : "text-gray-500 hover:text-[#0066FF]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>


        </div>

        {activeTab === "Sell" ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-blue-100 text-center max-w-lg w-full">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HomeIcon className="w-10 h-10 text-[#0066FF]" />
              </div>
              <h3 className="text-2xl font-bold text-[#000929] mb-4">Want to sell your property?</h3>
              <p className="text-gray-600 mb-8 text-lg">
                List your property with us and connect with potential buyers instantly.
              </p>
              <button
                onClick={() => router.push("/add-property")}
                className="w-full bg-[#0066FF] hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl text-lg"
              >
                Add Property
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {loading ? (
                // Loading State
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading properties from Firebase...</p>
                </div>
              ) : error ? (
                // Error State
                <div className="col-span-full text-center py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-red-600 mb-2">{error}</p>
                    <p className="text-gray-600">Please try again later</p>
                  </div>
                </div>
              ) : properties.length > 0 ? (
                // Dynamic Properties from Firebase
                filteredProperties.slice(0, visibleCount).map((property, index) => (
                  <div 
                    key={property.id}  
                    className="bg-white rounded-xl border border-gray-100 overflow-visible hover:shadow-xl transition-all duration-300 cursor-pointer group relative max-w-sm mx-auto w-full"
                    onClick={() => router.push(`/property/${property.id}`)}
                  >
                    <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-xl">
                      <Image
                        src={property.images?.[0] || property.image || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"}
                        className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                        alt={property.title || property.name || "Property"}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>

                    {/* Ribbon Badge - Only show for first 3 properties */}
                    {index < 3 && (
                      <div className="absolute top-[170px] sm:top-[200px] left-[-10px] z-10">
                        <div className="bg-[#007AFF] text-white px-4 py-2 rounded-tr-lg rounded-br-lg rounded-tl-lg text-xs font-bold flex items-center gap-1.5 shadow-lg relative">
                          <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                          <span className="tracking-wide">POPULAR</span>
                        </div>
                        {/* Fold Effect */}
                        <div className="absolute top-full left-0 w-[10px] h-[10px] overflow-hidden">
                          <div className="w-0 h-0 border-t-[10px] border-t-[#004999] border-l-[10px] border-l-transparent"></div>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-5 pt-6 sm:pt-8">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-[#0066FF] text-xl">
                            ₹{formatPrice(property).toLocaleString("en-IN")}
                            <span className="text-gray-400 text-sm font-normal ml-1">{getPriceSuffix(property)}</span>
                          </h3>
                          <h3 className="font-bold text-[#000929] text-lg mt-1 truncate max-w-[180px]">
                            {property.title || property.name || "Property Name"}
                          </h3>
                        </div>
                        
                        <button 
                          onClick={(e) => toggleFavorite(property.id, e)}
                          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                            favoriteProperties.has(property.id)
                              ? 'border-red-100 bg-red-50 text-red-500'
                              : 'border-blue-100 text-[#0066FF] hover:border-[#0066FF] hover:bg-blue-50'
                          }`}
                        >
                          <Heart className="w-5 h-5" fill={favoriteProperties.has(property.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} />
                        </button>
                      </div>
                      
                      <p className="text-gray-500 text-xs mb-5 border-b border-gray-100 pb-4 line-clamp-2 min-h-[3rem]">
                        {property.location || property.address || "Location Address"}
                      </p>
                      
                      <div className="flex flex-wrap gap-y-2 items-center justify-between text-gray-500">
                        {!(String(property.propertyCategory || '').toLowerCase().includes('land') || String(property.propertyCategory || '').toLowerCase().includes('plot')) && (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Bed className="w-4 h-4 text-[#0066FF]" />
                              <span className="text-xs"><span className="font-bold text-gray-700">{property.bedrooms || property.beds || 3}</span> Beds</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Bath className="w-4 h-4 text-[#0066FF]" />
                              <span className="text-xs"><span className="font-bold text-gray-700">{property.bathrooms || property.baths || 2}</span> Bathrooms</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Square className="w-4 h-4 text-[#0066FF]" />
                          <span className="text-xs">
                            <span className="font-bold text-gray-700">{property.area || property.sqft || "5x7"}</span> {getAreaUnitLabel(property)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // No Properties State
                <div className="col-span-full text-center py-12">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                    <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-900 font-medium mb-1">No properties found</p>
                    <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Browse More Properties Button */}
            <div className="text-center">
              <button 
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="bg-[#005DB2] hover:bg-[#004999] text-white px-8 py-3.5 rounded-lg font-semibold transition-colors shadow-lg shadow-blue-900/10"
              >
                Browse more properties
              </button>
            </div>
          </>
        )}
      </section>

      {/* NEW FEATURES SECTION */}
      <section className="bg-[#005DB2] text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header Row */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16 items-start">
            <h2 className="text-4xl font-bold leading-tight">
              We make it easy for <br />
              <span className="text-[#002554]">tenants</span> and <span className="text-[#002554]">landlords.</span>
            </h2>
            <p className="text-blue-100 text-base lg:text-sm leading-relaxed max-w-sm">
              Whether it’s selling your current home, getting financing, or buying a new home, we make it easy and efficient. The best part? you’ll save a bunch of money and time with our services.
            </p>
          </div>

          {/* Cards Row */}
          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {/* Virtual Home Tour Card */}
            <div className="bg-[#1A6DCC] rounded-lg p-8 flex items-start gap-5">
              <div className="bg-[#005DB2] rounded-full p-3 shrink-0 border border-blue-400/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Virtual home tour</h3>
                <p className="text-blue-100 text-sm leading-relaxed">You can communicate directly with landlords and we provide you with virtual tour before you buy or rent the property.</p>
              </div>
            </div>

            {/* Get Ready to Apply Card */}
            <div className="bg-[#1A6DCC] rounded-lg p-8 flex items-start gap-5">
              <div className="bg-[#005DB2] rounded-full p-3 shrink-0 border border-blue-400/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Get ready to apply</h3>
                <p className="text-blue-100 text-sm leading-relaxed">Find your dream house? You just need to do a little to no effort and you can start move in to your new dream home!</p>
              </div>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-t border-blue-400/30 pt-10 md:border-t-0 md:pt-0">
            <div className="md:border-r border-blue-400/30 last:border-r-0 pb-8 md:pb-0 border-b md:border-b-0">
              <div className="text-4xl font-bold mb-2">7.4%</div>
              <div className="text-blue-200">Property Return Rate</div>
            </div>
            <div className="md:border-r border-blue-400/30 last:border-r-0 pb-8 md:pb-0 border-b md:border-b-0">
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
      <section className="py-24 bg-[#F0F5FA]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="mb-3">
            <span className="text-[#0066FF] font-bold text-base">No Spam Promise</span>
          </div>
          
          <h2 className="text-4xl font-bold text-[#000929] mb-4">
            Are you a landlord?
          </h2>
          
          <p className="text-gray-500 text-base mb-10 max-w-xl mx-auto">
            Discover ways to increase your home&apos;s value and get listed. No Spam.
          </p>
          
          <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col sm:flex-row items-center max-w-lg mx-auto mb-8 gap-2 sm:gap-0">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-gray-700 placeholder-gray-400 w-full"
            />
            <button className="bg-[#0066FF] hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap w-full sm:w-auto">
              Submit
            </button>
          </div>
          
          <p className="text-gray-400 text-sm">
            Join <span className="text-[#0066FF]">10,000+</span> other landlords in our Primenivaas community.
          </p>
        </div>
      </section>

      {/* Floating SMS Widget */}
    </div>
  );
}

export default function HomeContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <HomeContentInner />
    </Suspense>
  );
}
