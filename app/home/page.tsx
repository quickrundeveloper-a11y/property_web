"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc, serverTimestamp, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/utils";
import { Property } from "@/lib/types";
import Image from "next/image";
import { Users, Key, Building2, Search as SearchIcon, Home as HomeIcon, ShieldCheck, CircleDollarSign, Percent, BadgePercent, DollarSign, Scan, Sparkles, Bed, Bath, Square, Heart, X, ChevronDown, Check, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";

import AddPropertyForm from "../components/add-property-form";

// Google Maps Types
type MapsLike = {
  places: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => AutocompleteLike };
};

type AutocompleteLike = {
  addListener: (event: string, cb: () => void) => void;
  getPlace: () => { geometry?: { location?: { lat: () => number; lng: () => number } }; formatted_address?: string };
};

// Range Slider Component
const RangeSlider = ({ min, max, value, onChange }: { min: number, max: number, value: [number, number], onChange: (val: [number, number]) => void }) => {
  const [minVal, maxVal] = value;
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = useCallback((value: number) => Math.round(((value - min) / (max - min)) * 100), [min, max]);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  return (
    <div className="range-slider-container">
      <input
        type="range"
        min={min}
        max={max}
        value={minVal}
        ref={minRef}
        onChange={(event) => {
          const value = Math.min(Number(event.target.value), maxVal - 1);
          onChange([value, maxVal]);
        }}
        className="range-input"
        style={{ zIndex: minVal > max - 100 ? "5" : "3" }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={maxVal}
        ref={maxRef}
        onChange={(event) => {
          const value = Math.max(Number(event.target.value), minVal + 1);
          onChange([minVal, value]);
        }}
        className="range-input"
        style={{ zIndex: 4 }}
      />
      <div className="slider-track" />
      <div ref={range} className="slider-range" />
    </div>
  );
};


const PROPERTY_CATEGORIES = {
  residential: {
    rent: [
      { label: "Apartment", value: "Flat/Apartment" },
      { label: "Independent House", value: "Independent House / Villa" },
      { label: "Duplex", value: "Duplex" },
      { label: "Independent Floor", value: "Independent / Builder Floor" },
      { label: "Villa", value: "Villa" },
      { label: "Penthouse", value: "Penthouse" },
      { label: "Studio", value: "1 RK/ Studio Apartment" },
      { label: "Farm House", value: "Farmhouse" },
      { label: "Agricultural Land", value: "Agricultural Land" }
    ],
    sell: [
      { label: "Apartment", value: "Flat/Apartment" },
      { label: "Independent House", value: "Independent House / Villa" },
      { label: "Duplex", value: "Duplex" },
      { label: "Independent Floor", value: "Independent / Builder Floor" },
      { label: "Villa", value: "Villa" },
      { label: "Penthouse", value: "Penthouse" },
      { label: "Studio", value: "1 RK/ Studio Apartment" },
      { label: "Plot", value: "Plot / Land" },
      { label: "Farm House", value: "Farmhouse" },
      { label: "Agricultural Land", value: "Agricultural Land" }
    ],
    pg: [
      { label: "Paying Guest", value: "Paying Guest" },
      { label: "Co-living", value: "Co-living" },
      { label: "Shared Flat", value: "Shared Flat" },
      { label: "Hostel", value: "Hostel" }
    ]
  },
  commercial: [
    { label: "Office", value: "Office" },
    { label: "Retail", value: "Retail" },
    { label: "Plot / Land", value: "Plot / Land" },
    { label: "Storage", value: "Storage" },
    { label: "Industry", value: "Industry" },
    { label: "Hospitality", value: "Hospitality" },
    { label: "Other", value: "Other" }
  ]
};

const POSTED_BY = ["Owner", "Agent", "Builder"];

function HomeContentInner() {
  const [activeTab, setActiveTab] = useState("Buy");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  // activeFilterCategory removed in favor of single view
  const [tempFilters, setTempFilters] = useState({
    lookingTo: "sell" as "rent" | "sell" | "pg",
    propertyCategoryType: "residential" as "residential" | "commercial",
    location: "",
    propertyTypes: [] as string[],
    minBudget: "", // Keeping for backward compatibility or reset
    maxBudget: "", // Keeping for backward compatibility or reset
    priceRange: [0, 50000000] as [number, number], // 0 to 5 Cr default
    bedroom: [] as string[],
    bathroom: [] as string[],
    balcony: [] as string[],
    constructionStatus: [] as string[],
    postedBy: [] as string[]
  });
  const [appliedFilters, setAppliedFilters] = useState({
    lookingTo: "sell" as "rent" | "sell" | "pg",
    propertyCategoryType: "residential" as "residential" | "commercial",
    location: "",
    propertyTypes: [] as string[],
    minBudget: "",
    maxBudget: "",
    priceRange: [0, 50000000] as [number, number],
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

  // Google Maps State & Refs
  const [mapsReady, setMapsReady] = useState(false);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const initializedInputRef = useRef<HTMLInputElement | null>(null);

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);

    if (typeof window !== "undefined" && !(window as unknown as { google?: unknown }).google && !existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setMapsReady(true);
      document.body.appendChild(script);
    } else {
      if ((window as unknown as { google?: unknown }).google) {
        setMapsReady(true);
      } else if (existingScript) {
        existingScript.addEventListener('load', () => setMapsReady(true));
      }
    }
  }, []);

  // Initialize Autocomplete when Modal is Open
  useEffect(() => {
    if (!mapsReady || !showFilters || !autocompleteInputRef.current) return;
    if (autocompleteInputRef.current === initializedInputRef.current) return;

    const googleObj = (window as unknown as { google?: { maps: { places: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => AutocompleteLike } } } }).google!;
    
    const autocomplete = new googleObj.maps.places.Autocomplete(autocompleteInputRef.current, {
      fields: ["formatted_address"],
      componentRestrictions: { country: "in" }
    });
    
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const address = place.formatted_address || "";
      if (address) {
        setTempFilters(prev => ({ ...prev, location: address }));
      }
    });

    initializedInputRef.current = autocompleteInputRef.current;
  }, [mapsReady, showFilters]);

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



  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    sessionStorage.setItem('property_web_filters', JSON.stringify(tempFilters));

    // Sync activeTab with filter selection
    if (tempFilters.lookingTo === 'rent' || tempFilters.lookingTo === 'pg') {
      setActiveTab('Rent');
    } else if (tempFilters.lookingTo === 'sell') {
      setActiveTab('Buy');
    }

    setShowFilters(false);
    setTimeout(() => {
      propertyGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const cancelFilters = () => {
    setTempFilters(appliedFilters);
    setShowFilters(false);
  };

  const clearAllFilters = () => {
    setTempFilters({
      lookingTo: "sell",
      propertyCategoryType: "residential",
      location: "",
      propertyTypes: [],
      minBudget: "",
      maxBudget: "",
      priceRange: activeTab === 'Rent' ? [0, 500000] : [0, 50000000],
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
    if (typeof window !== "undefined" && !(window as any).propertyWebReloadChecked) {
      const entries = performance.getEntriesByType("navigation");
      const isReload = entries.length > 0 && (entries[0] as PerformanceNavigationTiming).type === 'reload';

      if (isReload) {
        sessionStorage.removeItem('property_web_filters');
      }
      (window as any).propertyWebReloadChecked = true;
    }

    const savedFilters = sessionStorage.getItem('property_web_filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setAppliedFilters(parsed);
        setTempFilters(parsed);
        
        if (parsed.lookingTo === 'rent' || parsed.lookingTo === 'pg') {
          setActiveTab('Rent');
        } else if (parsed.lookingTo === 'sell') {
          setActiveTab('Buy');
        }
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
  }, []);

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

  // Helper function to get property price value
  const getPropertyPriceValue = (item: Property) => {
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
          ...docData,
          id: doc.id,
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
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          ...docData,
          id: doc.id,
          // Ensure required fields exist - matching fetchProperties logic
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
      setProperties(data);
      setLoading(false);
    }, (err) => {
      console.error("Realtime properties error:", err);
      setError("Failed to subscribe to properties");
      setLoading(false);
    });
    return () => unsub();
  }, []);



  const filteredProperties = properties.filter(property => {
    if (!property || !property.id) return false;
    if (!matchesActiveType(property)) return false;
    
    // Global Search Query (Title/Location) - Removed early strict check to allow final comprehensive check


    // Apply Advanced Filters
    
    // Filter by Looking To (Rent/Sell/PG)
    if (appliedFilters.lookingTo) {
      const type = String(property.type || property.propertyType || '').toLowerCase();
      const unit = String(property.priceUnit || '').toLowerCase();
      const isRent = type.includes('rent') || type.includes('pg') || unit === 'per_month' || unit === 'per_year';
      
      if (appliedFilters.lookingTo === 'rent') {
        if (!isRent) return false;
      } else if (appliedFilters.lookingTo === 'pg') {
         if (!type.includes('pg') && !type.includes('paying') && !type.includes('guest')) return false;
      } else if (appliedFilters.lookingTo === 'sell') {
        if (isRent && !type.includes('buy') && !type.includes('sell')) return false;
      }
    }

    // Filter by Property Category Type (Residential/Commercial)
    if (appliedFilters.propertyCategoryType) {
       const pType = String(property.propertyType || property.type || property.category || property.propertyCategory || '').toLowerCase();
       const isCommercial = pType.includes('commercial') || pType.includes('office') || pType.includes('retail') || pType.includes('industry') || pType.includes('storage') || pType.includes('hospitality') || pType.includes('shop') || pType.includes('showroom');
       const isResidentialSpecific = pType.includes('flat') || pType.includes('apartment') || pType.includes('house') || pType.includes('villa') || pType.includes('penthouse') || pType.includes('studio') || pType.includes('residential');

       if (appliedFilters.propertyCategoryType === 'commercial') {
         if (isResidentialSpecific) return false;
       } else {
         // Residential
         if (isCommercial) return false;
       }
    }

    if (appliedFilters.propertyTypes.length > 0) {
      // Combine all type-related fields to ensure comprehensive matching
      // Priority: propertyCategory (Flat/Apartment) > propertyType (Residential) > type (Rent/Sell)
      const pType = [
        property.propertyCategory, 
        property.category, 
        property.propertyType, 
        property.type
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesType = appliedFilters.propertyTypes.some(filterType => {
        if (filterType === "Flat/Apartment") return pType.includes('flat') || pType.includes('apartment');
        if (filterType === "Independent/Builder Floor") return pType.includes('builder') || pType.includes('floor');
        if (filterType === "Independent House/Villa") return pType.includes('house') || pType.includes('villa');
        if (filterType === "Plot / Land") return pType.includes('land') || pType.includes('plot');
        if (filterType === "1 RK/Studio Apartment") return pType.includes('1 rk') || pType.includes('studio');
        if (filterType === "Farmhouse") return pType.includes('farm');
        if (filterType === "Paying Guest") return pType.includes('paying') || pType.includes('pg');
        if (filterType === "Co-living") return pType.includes('co-living') || pType.includes('coliving');
        return pType.includes(filterType.toLowerCase());
      });
      if (!matchesType) return false;
    }

    // Location Filter
    if (appliedFilters.location) {
      const loc = appliedFilters.location.toLowerCase().trim();
      const pLoc = (property.location || property.address || '').toLowerCase();
      const pTitle = (property.title || property.name || '').toLowerCase();
      
      // Split google places address into parts (e.g. "City, State, Country")
      const locParts = loc.split(',').map(part => part.trim()).filter(Boolean);
      const mainLoc = locParts[0]; // Primary location (e.g. "Bangalore")

      // Check if property location matches full search, or if search matches property location (bidirectional)
      // Also check if the primary location part is found in the property location
      const matchesLocation = 
        pLoc.includes(loc) || 
        loc.includes(pLoc) || 
        pTitle.includes(loc) ||
        (mainLoc && pLoc.includes(mainLoc));

      if (!matchesLocation) return false;
    }

    // Price Range Filter
    const price = getPropertyPriceValue(property);
    if (price < appliedFilters.priceRange[0] || price > appliedFilters.priceRange[1]) return false;

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
      // Check availabilityStatus first as it matches the add-property form field
      const status = (property.availabilityStatus || property.constructionStatus || property.status || '').toLowerCase();
      const matchesStatus = appliedFilters.constructionStatus.some(s => status.includes(s.toLowerCase()));
      if (!matchesStatus) return false;
    }

    if (appliedFilters.postedBy.length > 0) {
      const posted = (property.postedBy || property.userType || '').toLowerCase();
      const matchesPosted = appliedFilters.postedBy.some(p => {
        const pLower = p.toLowerCase();
        // Handle "Dealer" mapping to "Agent" or "Broker" as they are often used interchangeably
        if (pLower === 'dealer') return posted.includes('dealer') || posted.includes('agent') || posted.includes('broker');
        return posted.includes(pLower);
      });
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
              <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-4 w-full lg:max-w-[70vw]">
                {/* Tabs Container - Horizontal Pill Style */}
                <div className="bg-white rounded-xl p-1.5 flex items-center shadow-lg gap-1 shrink-0">
                  <button
                    onClick={() => scrollToFilter("Rent")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "Rent"
                        ? "bg-blue-50 text-[#0066FF] shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Rent
                  </button>
                  <button
                    onClick={() => scrollToFilter("Buy")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "Buy"
                        ? "bg-blue-50 text-[#0066FF] shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => scrollToFilter("Sell")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "Sell"
                        ? "bg-blue-50 text-[#0066FF] shadow-sm"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Sell Property
                  </button>
                </div>

                {/* Search Component - Thinner Style */}
                <div className="flex-1 w-full lg:w-auto min-w-[200px] relative z-40">
                  <div 
                    onClick={() => setShowFilters(true)}
                    className="bg-white rounded-xl shadow-lg p-1.5 pl-6 flex items-center gap-4 transition-all hover:shadow-xl border border-gray-100 cursor-pointer h-12"
                  >
                    <SearchIcon className="w-5 h-5 text-gray-400" />
                    
                    <div className="flex-1 text-gray-500 text-base font-medium truncate select-none">
                      {searchQuery || "Search properties, locations..."}
                    </div>

                    <div className="bg-[#0066FF] hover:bg-blue-600 text-white p-2.5 rounded-lg shadow-md hover:shadow-blue-200 transition-all transform hover:scale-105">
                       <SlidersHorizontal className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Centered Filter Modal */}
                {showFilters && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                      onClick={cancelFilters}
                    />
                    
                    {/* Modal Card */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 duration-200">
                      
                      {/* Header */}
                      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <SlidersHorizontal className="w-5 h-5 text-[#0066FF]" />
                          Filters
                        </h3>
                        <button 
                          onClick={clearAllFilters}
                          className="text-[#0066FF] text-sm font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Reset all
                        </button>
                      </div>

                      {/* Scrollable Content */}
                      <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                        
                        {/* Location with Google Places */}
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" /> Location
                          </label>
                          <div className="relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#0066FF] transition-colors" />
                            <input
                              ref={autocompleteInputRef}
                              type="text"
                              value={tempFilters.location}
                              onChange={(e) => setTempFilters(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="Enter city, locality or landmark"
                              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-100 focus:border-[#0066FF] outline-none transition-all"
                            />
                          </div>
                        </div>

                        {/* Looking To */}
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <SearchIcon className="w-4 h-4 text-gray-500" /> Looking For
                          </label>
                          <div className="flex bg-gray-50 p-1 rounded-xl">
                            {[{label: 'Buy', value: 'sell'}, {label: 'Rent', value: 'rent'}, {label: 'PG / Co-living', value: 'pg'}].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setTempFilters(prev => ({ 
                                  ...prev, 
                                  lookingTo: opt.value as any,
                                  // Force residential if PG is selected
                                  propertyCategoryType: opt.value === 'pg' ? 'residential' : prev.propertyCategoryType
                                }))}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                                  tempFilters.lookingTo === opt.value
                                    ? "bg-white text-[#0066FF] shadow-sm font-bold"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Property Category Type (Residential/Commercial) */}
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" /> Property Type
                          </label>
                          <div className="flex bg-gray-50 p-1 rounded-xl">
                            {['residential', 'commercial']
                              .filter(type => !(tempFilters.lookingTo === 'pg' && type === 'commercial'))
                              .map((type) => (
                              <button
                                key={type}
                                onClick={() => setTempFilters(prev => ({ ...prev, propertyCategoryType: type as any }))}
                                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all capitalize ${
                                  tempFilters.propertyCategoryType === type
                                    ? "bg-white text-[#0066FF] shadow-sm font-bold"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Property Category (Dynamic Options) */}
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <HomeIcon className="w-4 h-4 text-gray-500" /> Property Category
                          </label>
                          <div className="flex flex-wrap gap-2.5">
                            {(() => {
                              const type = tempFilters.propertyCategoryType;
                              const look = tempFilters.lookingTo;
                              let options = [];
                              
                              if (type === 'commercial') {
                                options = PROPERTY_CATEGORIES.commercial;
                              } else {
                                // Residential
                                if (look === 'rent') options = PROPERTY_CATEGORIES.residential.rent;
                                else if (look === 'pg') options = PROPERTY_CATEGORIES.residential.pg;
                                else options = PROPERTY_CATEGORIES.residential.sell;
                              }

                              return options.map(opt => (
                                <label 
                                  key={opt.value} 
                                  className={`cursor-pointer px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 select-none ${
                                    tempFilters.propertyTypes.includes(opt.value)
                                      ? "bg-blue-50 border-blue-200 text-[#0066FF] shadow-sm"
                                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={tempFilters.propertyTypes.includes(opt.value)}
                                    onChange={() => handleFilterChange('propertyTypes', opt.value)}
                                    className="hidden"
                                  />
                                  {tempFilters.propertyTypes.includes(opt.value) ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full border border-gray-300" />
                                  )}
                                  {opt.label}
                                </label>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Budget */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <CircleDollarSign className="w-4 h-4 text-gray-500" /> Budget Range
                            </label>
                            <span className="text-[#0066FF] font-bold text-sm bg-blue-50 px-3 py-1 rounded-lg">
                              {tempFilters.priceRange[0] === 0 ? '0' : (tempFilters.priceRange[0] >= 10000000 ? `₹${(tempFilters.priceRange[0] / 10000000).toFixed(2)}Cr` : (tempFilters.priceRange[0] >= 100000 ? `₹${(tempFilters.priceRange[0] / 100000).toFixed(1)}L` : `₹${(tempFilters.priceRange[0] / 1000).toFixed(0)}k`))} - {tempFilters.priceRange[1] >= 10000000 ? `₹${(tempFilters.priceRange[1] / 10000000).toFixed(2)}Cr` : (tempFilters.priceRange[1] >= 100000 ? `₹${(tempFilters.priceRange[1] / 100000).toFixed(1)}L` : `₹${(tempFilters.priceRange[1] / 1000).toFixed(0)}k`)}
                            </span>
                          </div>
                          <div className="px-2 py-4 bg-gray-50 rounded-xl border border-gray-100">
                            <RangeSlider
                              min={0}
                              max={tempFilters.lookingTo === 'rent' || tempFilters.lookingTo === 'pg' ? 500000 : 50000000}
                              value={[
                                Math.min(tempFilters.priceRange[0], tempFilters.lookingTo === 'rent' || tempFilters.lookingTo === 'pg' ? 500000 : 50000000),
                                Math.min(tempFilters.priceRange[1], tempFilters.lookingTo === 'rent' || tempFilters.lookingTo === 'pg' ? 500000 : 50000000)
                              ]}
                              onChange={(val) => setTempFilters(prev => ({ ...prev, priceRange: val }))}
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-6 font-medium px-1">
                              <span>Min</span>
                              <span>Max ({tempFilters.lookingTo === 'rent' || tempFilters.lookingTo === 'pg' ? '5L+' : '5Cr+'})</span>
                            </div>
                          </div>
                        </div>

                        {/* Posted By */}
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" /> Posted By
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {POSTED_BY.map(poster => (
                              <button
                                key={poster}
                                onClick={() => handleFilterChange('postedBy', poster)}
                                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                  tempFilters.postedBy.includes(poster)
                                  ? "bg-blue-50 border-blue-200 text-[#0066FF] ring-1 ring-blue-100"
                                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {tempFilters.postedBy.includes(poster) && <Check className="w-3.5 h-3.5" />}
                                {poster}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Footer */}
                      <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button 
                          onClick={cancelFilters}
                          className="px-6 py-3 rounded-xl text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={applyFilters}
                          className="bg-[#0066FF] hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-blue-200 transition-all flex items-center gap-2"
                        >
                          <SearchIcon className="w-4 h-4" />
                          Show Properties
                        </button>
                      </div>
                      
                    </div>
                  </div>
                )}

                {/* Browse Properties Button */}
                <button
                  onClick={() => scrollToFilter("Buy")}
                  className="h-12 bg-[#0085FF] hover:bg-blue-600 text-white px-6 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all text-sm whitespace-nowrap flex items-center justify-center"
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
                            {formatPrice(getPropertyPriceValue(property))}
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
