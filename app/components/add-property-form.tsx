"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, Loader2, Building2, Home, Users, Briefcase, Store, Warehouse, Factory, MoreHorizontal, Building, Armchair, LandPlot, Archive, Coffee, ArrowUp, Sprout, Car, Sofa, Trees, Waves, Droplets } from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";

type MapsLike = {
  addListener: (event: string, cb: (e?: unknown) => void) => void;
  panTo: (pos: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
};

type MarkerLike = {
  setPosition?: (pos: { lat: number; lng: number }) => void;
  position?: { lat: number; lng: number };
  addListener?: (event: string, cb: (e?: unknown) => void) => void;
};

type GeocoderLike = {
  geocode: (opts: { location: { lat: number; lng: number } }) => Promise<{ results?: Array<{ formatted_address?: string }> }>;
};

type AutocompleteLike = {
  addListener: (event: string, cb: () => void) => void;
  getPlace: () => { geometry?: { location?: { lat: () => number; lng: () => number } }; formatted_address?: string };
};

import { useAuth } from "@/lib/auth-context";

export default function AddPropertyForm({ defaultType = "sell", onSuccess, initialData, propertyId, currentStep = 1, onStepChange, onScoreChange }: { defaultType?: "rent" | "sell", onSuccess?: () => void, initialData?: Partial<import("@/lib/types").Property> & { lat?: number; lng?: number; OwnerName?: string; email?: string }, propertyId?: string, currentStep?: number, onStepChange?: (step: number) => void, onScoreChange?: (score: number) => void }) {
  const { user } = useAuth();
  const [internalStep, setInternalStep] = useState(currentStep);
  
  useEffect(() => {
    setInternalStep(currentStep);
  }, [currentStep]);

  const activeStep = onStepChange ? currentStep : internalStep;

  const [loading, setLoading] = useState(false);
  const [lookingTo, setLookingTo] = useState<"sell" | "rent" | "pg">("sell");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [floorPlan, setFloorPlan] = useState<File | null>(null);
  const [existingFloorPlan, setExistingFloorPlan] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
    price: "",
    bedrooms: "",
    bedroomsCount: "",
    bathrooms: "",
    bathroomsCount: "",
    area: "",
    priceUnit: "per_month",
    units: "sqft",
    features: [] as string[],
    description: "",
    OwnerName: "",
    phone: "",
    email: "",
    type: defaultType as "rent" | "sell" | "pg",
    propertyType: "residential",
    propertyCategory: "Flat/Apartment",
    totalFloors: "" as string | number,
    floorNumber: "" as string | number,
    furnishingStatus: "",
    builderFloorType: "Single Floor" as "Single Floor" | "Duplex" | "Triplex",
    plotArea: "" as string | number,
    plotLength: "" as string | number,
    plotBreadth: "" as string | number,
    floorsAllowed: "" as string | number,
    boundaryWall: "" as "Yes" | "No" | "",
    openSides: "" as string | number,
    anyConstruction: "" as "Yes" | "No" | "",
    possessionBy: "" as string,
    balconies: "",
    balconiesCount: "",
    otherRooms: [] as string[],
    coveredParking: "",
    openParking: "",
    availabilityStatus: "",
    ageOfProperty: "",
    facing: "",
    overlooking: [] as string[],
    waterSource: [] as string[],
    flooring: "",
    powerBackup: "",
    facingRoadWidth: "",
    facingRoadUnit: "Meter",
    ownership: "",
    allInclusivePrice: false,
    taxExcluded: false,
    priceNegotiable: false,
    uniqueDescription: "",
    availableFrom: "",
    preferredTenants: [] as string[],
    userType: "" as "Owner" | "Agent" | "Builder" | "",
    propertySubType: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [possessionPickerOpen, setPossessionPickerOpen] = useState(false);
  const [possessionYear, setPossessionYear] = useState<string>("");
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        location: initialData.location || "",
        lat: initialData.lat ?? null,
        lng: initialData.lng ?? null,
        price: initialData.price ? String(initialData.price) : "",
        bedrooms: initialData.bedrooms ? String(initialData.bedrooms) : "",
        bedroomsCount: "",
        bathrooms: initialData.bathrooms ? String(initialData.bathrooms) : "",
        bathroomsCount: "",
        area: initialData.area ? String(initialData.area) : "",
        priceUnit: initialData.priceUnit || "per_month",
        units: initialData.units || "sqft",
        features: initialData.features || [],
        description: initialData.description || "",
        OwnerName: initialData.OwnerName || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        type: (initialData.type as "rent" | "sell" | "pg") || defaultType,
        propertyType: initialData.propertyType || "residential",
        propertyCategory: initialData.propertyCategory || "Flat/Apartment",
        totalFloors: initialData.totalFloors || "",
        floorNumber: initialData.floorNumber || "",
        furnishingStatus: initialData.furnishingStatus || "",
        builderFloorType: (initialData.builderFloorType as "Single Floor" | "Duplex" | "Triplex") || "Single Floor",
        plotArea: initialData.plotArea || "",
        plotLength: initialData.plotLength || "",
        plotBreadth: initialData.plotBreadth || "",
        floorsAllowed: initialData.floorsAllowed || "",
        boundaryWall: (initialData.boundaryWall as "Yes" | "No" | "") || "",
        openSides: initialData.openSides || "",
        anyConstruction: (initialData.anyConstruction as "Yes" | "No" | "") || "",
        possessionBy: initialData.possessionBy || "",
        balconies: initialData.balconies ? String(initialData.balconies) : "",
        balconiesCount: "",
        otherRooms: initialData.otherRooms || [],
        coveredParking: initialData.coveredParking ? String(initialData.coveredParking) : "",
        openParking: initialData.openParking ? String(initialData.openParking) : "",
        availabilityStatus: initialData.availabilityStatus || "",
        ageOfProperty: initialData.ageOfProperty || "",
        facing: initialData.facing || "",
        overlooking: initialData.overlooking || [],
        waterSource: initialData.waterSource || [],
        flooring: initialData.flooring || "",
        powerBackup: initialData.powerBackup || "",
        facingRoadWidth: initialData.facingRoadWidth ? String(initialData.facingRoadWidth) : "",
        facingRoadUnit: initialData.facingRoadUnit || "Meter",
        ownership: initialData.ownership || "",
        allInclusivePrice: initialData.allInclusivePrice || false,
        taxExcluded: initialData.taxExcluded || false,
        priceNegotiable: initialData.priceNegotiable || false,
        uniqueDescription: initialData.uniqueDescription || "",
        availableFrom: initialData.availableFrom || "",
        preferredTenants: initialData.preferredTenants || [],
        userType: initialData.userType || "",
        propertySubType: initialData.propertySubType || "",
      });
      if (initialData.images) {
        setExistingImages(initialData.images);
      }
      if (initialData.videoUrl) {
        setExistingVideo(initialData.videoUrl);
      }
      if (initialData.floorPlan) {
        setExistingFloorPlan(initialData.floorPlan);
      }
      if (initialData.type) {
        setLookingTo(initialData.type === "sell" ? "sell" : "rent");
      }
    } else {
      setLookingTo(defaultType === "sell" ? "sell" : "rent");
    }
  }, [initialData, defaultType]);

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [coverSelection, setCoverSelection] = useState<{ source: 'existing' | 'new', index: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const initializedInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<MapsLike | null>(null);
  const markerRef = useRef<MarkerLike | null>(null);
  const geocoderRef = useRef<GeocoderLike | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update lat/lng state
        setFormData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude
        }));

        // Move map if available
        if (mapRef.current) {
          mapRef.current.panTo({ lat: latitude, lng: longitude });
          if (markerRef.current) {
            if (markerRef.current.setPosition) {
              markerRef.current.setPosition({ lat: latitude, lng: longitude });
            } else {
              markerRef.current.position = { lat: latitude, lng: longitude };
            }
          }
        }

        try {
           const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
           // If we have Google Maps loaded and Geocoder available
           if (apiKey && mapsReady && geocoderRef.current) {
             const result = await geocoderRef.current.geocode({ location: { lat: latitude, lng: longitude } });
             const address = result.results?.[0]?.formatted_address;
             
             if (address) {
               setFormData(prev => ({
                 ...prev,
                 location: address,
                 lat: latitude,
                 lng: longitude
               }));
               if (autocompleteInputRef.current) {
                 autocompleteInputRef.current.value = address;
               }
             }
           } else {
             // Fallback to OpenStreetMap Nominatim
             const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
             const data = await response.json();
             const address = data.display_name;
             
             if (address) {
                setFormData(prev => ({
                 ...prev,
                 location: address,
                 lat: latitude,
                 lng: longitude
               }));
             } else {
                setFormData(prev => ({
                 ...prev,
                 location: `${latitude}, ${longitude}`,
                 lat: latitude,
                 lng: longitude
               }));
             }
           }
        } catch (error) {
          console.error("Error getting address:", error);
          // Fallback to coordinates
           setFormData(prev => ({
             ...prev,
             location: `${latitude}, ${longitude}`,
             lat: latitude,
             lng: longitude
           }));
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to retrieve your location";
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = "Location permission denied. Please allow location access in your browser settings.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = "Location information is unavailable. Please checks your network connection.";
            break;
          case 3: // TIMEOUT
            errorMessage = "The request to get user location timed out.";
            break;
        }
        alert(errorMessage);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const standardizeImage = (file: File, targetWidth = 1200, targetHeight = 900): Promise<File> => {
    return new Promise((resolve) => {
      // Always standardize to fixed dimensions using canvas
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        
        // Calculate scaling to cover the target area (like object-cover)
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = Math.round(img.width * scale);
        const scaledHeight = Math.round(img.height * scale);
        
        // Center crop
        const x = Math.round((scaledWidth - targetWidth) / 2);
        const y = Math.round((scaledHeight - targetHeight) / 2);
        
        ctx.drawImage(img, -x, -y, scaledWidth, scaledHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name.replace(/\.(\w+)$/, ".jpg"), { type: "image/jpeg" });
            resolve(compressed);
          } else {
            resolve(file);
          }
        }, "image/jpeg", 0.85);
      };
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };
  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls([...existingImages, ...urls]);
    // initialize cover selection if not set
    if (!coverSelection) {
      if (existingImages.length > 0) {
        setCoverSelection({ source: 'existing', index: 0 });
      } else if (images.length > 0) {
        setCoverSelection({ source: 'new', index: 0 });
      }
    }
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images, existingImages, coverSelection]);
  
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    // Check if script is already present
    const existingScript = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`);

    if (typeof window !== "undefined" && !(window as unknown as { google?: unknown }).google && !existingScript) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        setMapsReady(true);
      };
      document.body.appendChild(script);
    } else {
      if ((window as unknown as { google?: unknown }).google) {
        setMapsReady(true);
      } else if (existingScript) {
        // If script exists but google object not yet available, wait for load
        existingScript.addEventListener('load', () => setMapsReady(true));
      }
    }
  }, []);
  
  useEffect(() => {
    if (!mapsReady) return;
    
    // Initialize Google Maps objects
    const googleObj = (window as unknown as {
      google?: {
        maps: {
          Geocoder: new () => GeocoderLike;
          places: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => AutocompleteLike };
        };
      };
    }).google!;
    
    // Initialize Geocoder
    if (!geocoderRef.current) {
      geocoderRef.current = new googleObj.maps.Geocoder();
    }
    
    // Initialize Autocomplete
    // We check if the input exists and if it's different from the one we last initialized
    if (autocompleteInputRef.current && autocompleteInputRef.current !== initializedInputRef.current) {
      
      const autocomplete = new googleObj.maps.places.Autocomplete(autocompleteInputRef.current, {
        fields: ["geometry", "formatted_address"]
      });
      
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const loc = place.geometry?.location;
        const address = place.formatted_address || "";
        
        if (loc) {
          const lat = loc.lat();
          const lng = loc.lng();
          setFormData(prev => ({ ...prev, location: address, lat, lng }));
        } else {
          setFormData(prev => ({ ...prev, location: address }));
        }
      });
      
      // Mark this input element as initialized
      initializedInputRef.current = autocompleteInputRef.current;
    }
  }, [mapsReady, activeStep]);
  
  const handleFilesAdd = (files: File[]) => {
    setImages(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const incoming = files.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...incoming];
    });
  };

  const removeImageAt = (index: number) => {
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      const newIndex = index - existingImages.length;
      setImages(prev => prev.filter((_, i) => i !== newIndex));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, boolean> = {};
    let isValid = true;

    // Debug validation
    console.log(`Validating Step ${step}`, formData);

    switch (step) {
      case 1:
        if (!formData.userType) {
          newErrors.userType = true;
          isValid = false;
        }
        if (!formData.propertyType) {
          newErrors.propertyType = true;
          isValid = false;
        }
        if (!formData.propertyCategory) {
          newErrors.propertyCategory = true;
          isValid = false;
        }
        if (!formData.type) {
          newErrors.type = true;
          isValid = false;
        }
        break;
      case 2:
        if (!formData.location) {
          newErrors.location = true;
          isValid = false;
        }
        break;
      case 3:
        // Ensure property category logic handles both Land/Plot and others correctly
        const isLand = formData.propertyCategory?.includes("Land") || formData.propertyCategory?.includes("Plot");
        
        if (isLand) {
             if (!formData.plotArea) newErrors.plotArea = true;
        } else {
           if (formData.propertyType === "residential" && (!formData.bedrooms || (formData.bedrooms === "5+" && !formData.bedroomsCount))) newErrors.bedrooms = true;
           if (!formData.bathrooms || (formData.bathrooms === "4+" && !formData.bathroomsCount)) newErrors.bathrooms = true;
           if (!formData.area) newErrors.area = true;
        }

        if (!formData.description) {
          newErrors.description = true;
          isValid = false;
        }
        
        if (Object.keys(newErrors).length > 0) isValid = false;
        break;
      case 4:
        if (images.length === 0 && existingImages.length === 0) {
          newErrors.images = true;
          isValid = false;
        }
        break;
      case 5:
        if (!formData.title) {
          newErrors.title = true;
          isValid = false;
        }
        
        if (!formData.price) {
          newErrors.price = true;
          isValid = false;
        }

        if (!formData.OwnerName) {
          newErrors.OwnerName = true;
          isValid = false;
        }

        if (!formData.phone) {
          newErrors.phone = true;
          isValid = false;
        }

        if (!formData.email) {
          newErrors.email = true;
          isValid = false;
        }
        break;
      default:
        return true;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (activeStep < 6) {
      if (!validateStep(activeStep)) {
        setWarning("Please fill all mandatory fields marked with *");
        return;
      }
      setWarning(null);
      
      const nextStep = activeStep + 1;
      setInternalStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
      
      if (onScoreChange) onScoreChange(Math.min(100, nextStep * 20));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setWarning(null);
    if (activeStep > 1) {
      const prevStep = activeStep - 1;
      setInternalStep(prevStep);
      if (onStepChange) onStepChange(prevStep);
      window.scrollTo(0, 0);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* User Type Section */}
      <div>
        <h3 className="text-lg font-bold text-[#000929] mb-4">You are: <span className="text-red-500">*</span></h3>
        <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
          {["Owner", "Agent", "Builder"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({ ...formData, userType: type as "Owner" | "Agent" | "Builder" })}
              className={`px-4 md:px-8 py-3 rounded-full text-sm md:text-base font-medium transition-all flex-1 min-w-[100px] sm:min-w-[140px] border ${
                formData.userType === type
                  ? "bg-blue-50 text-[#0085FF] border-[#0085FF]"
                  : errors.userType
                    ? "bg-white border-red-500 text-gray-500"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
             {formData.bathrooms === "4+" && (
               <input
                 type="text"
                 inputMode="numeric"
                 placeholder={formData.propertyType === "commercial" ? "No. of Washrooms" : "No. of Bathrooms"}
                 value={formData.bathroomsCount}
                 onChange={(e) => setFormData({ ...formData, bathroomsCount: e.target.value })}
                 className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
               />
             )}
      </div>

      {/* Property Type Section (Moved to Top) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Property Type <span className="text-red-500">*</span></h3>
        <div className="flex flex-wrap gap-3 md:gap-4 mb-6">
          {[
            { label: "Residential", value: "residential" },
            { label: "Commercial", value: "commercial" }
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({
                ...formData, 
                propertyType: option.value as "residential" | "commercial", 
                propertyCategory: option.value === "residential" ? "Flat/Apartment" : "Office"
              })}
              className={`px-4 md:px-8 py-3 rounded-lg text-sm md:text-base font-medium transition-all flex-1 min-w-[100px] sm:min-w-[140px] ${
                formData.propertyType === option.value
                  ? "bg-blue-50 text-[#0066FF] border border-blue-50" 
                  : errors.propertyType 
                    ? "bg-white border border-red-500 text-gray-900"
                    : "bg-white border border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Property Category Grid (Image 1 Style) */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">Property Category <span className="text-red-500">*</span></h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {(() => {
            let options = [];
            if (formData.propertyType === "residential") {
                if (lookingTo === "rent") {
                     options = [
                        { label: "Apartment", value: "Flat/Apartment", icon: Building2 },
                        { label: "Independent House", value: "Independent House / Villa", icon: Home },
                        { label: "Duplex", value: "Duplex", icon: Home },
                        { label: "Independent Floor", value: "Independent / Builder Floor", icon: Building },
                        { label: "Villa", value: "Villa", icon: Home },
                        { label: "Penthouse", value: "Penthouse", icon: ArrowUp },
                        { label: "Studio", value: "1 RK/ Studio Apartment", icon: Armchair },
                        { label: "Farm House", value: "Farmhouse", icon: Warehouse },
                        { label: "Agricultural Land", value: "Agricultural Land", icon: Sprout }
                      ];
                } else if (lookingTo === "pg") {
                    options = [
                        { label: "Paying Guest", value: "Paying Guest", icon: Users },
                        { label: "Co-living", value: "Co-living", icon: Users },
                        { label: "Shared Flat", value: "Shared Flat", icon: Building2 },
                        { label: "Hostel", value: "Hostel", icon: Home }
                    ];
                } else {
                     options = [
                        { label: "Apartment", value: "Flat/Apartment", icon: Building2 },
                        { label: "Independent House", value: "Independent House / Villa", icon: Home },
                        { label: "Duplex", value: "Duplex", icon: Home },
                        { label: "Independent Floor", value: "Independent / Builder Floor", icon: Building },
                        { label: "Villa", value: "Villa", icon: Home },
                        { label: "Penthouse", value: "Penthouse", icon: ArrowUp },
                        { label: "Studio", value: "1 RK/ Studio Apartment", icon: Armchair },
                        { label: "Plot", value: "Plot / Land", icon: LandPlot },
                        { label: "Farm House", value: "Farmhouse", icon: Warehouse },
                        { label: "Agricultural Land", value: "Agricultural Land", icon: Sprout }
                      ];
                }
            } else {
                options = [
                    { label: "Office", value: "Office", icon: Briefcase },
                    { label: "Retail", value: "Retail", icon: Store },
                    { label: "Plot / Land", value: "Plot / Land", icon: LandPlot },
                    { label: "Storage", value: "Storage", icon: Archive },
                    { label: "Industry", value: "Industry", icon: Factory },
                    { label: "Hospitality", value: "Hospitality", icon: Coffee },
                    { label: "Other", value: "Other", icon: MoreHorizontal }
                ];
            }
            
            return options.map((opt) => {
                const Icon = opt.icon;
                return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({...formData, propertyCategory: opt.value, propertySubType: ""})}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 hover:shadow-md ${
                    formData.propertyCategory === opt.value
                      ? "bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-sm" 
                      : errors.propertyCategory
                        ? "bg-white border-red-500 text-gray-500"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${formData.propertyCategory === opt.value ? "text-[#0066FF]" : "text-gray-400"}`} />
                  <span className="text-sm font-medium text-center leading-tight">{opt.label}</span>
                </button>
            )});
          })()}
            </div>
            {formData.bathrooms === "4+" && (
              <input
                type="text"
                inputMode="numeric"
                placeholder={formData.propertyType === "commercial" ? "No. of Washrooms" : "No. of Bathrooms"}
                value={formData.bathroomsCount}
                onChange={(e) => setFormData({ ...formData, bathroomsCount: e.target.value })}
                className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              />
            )}
      </div>

      {/* Commercial Sub-Type Selection */}
      {formData.propertyType === "commercial" && (
        (() => {
          const subTypes: Record<string, { title: string, options: string[] }> = {
            "Office": {
              title: "Your office type is ...",
              options: ["Ready to move office space", "Bare shell office space", "Co-working office space"]
            },
            "Retail": {
              title: "Your retail space type is ...",
              options: ["Commercial Shops", "Commercial Showrooms"]
            },
            "Plot / Land": {
              title: "Your plot / land type is ...",
              options: ["Commercial Land/Inst. Land", "Agricultural/Farm Land", "Industrial Lands/Plots"]
            },
            "Storage": {
              title: "Your storage type is ...",
              options: ["Ware House", "Cold Storage"]
            },
            "Industry": {
              title: "Your industry type is ...",
              options: ["Factory", "Manufacturing"]
            },
            "Hospitality": {
              title: "Your hospitality type is ...",
              options: ["Hotel/Resorts", "Guest-House/Banquet-Halls"]
            }
          };

          const currentSubType = subTypes[formData.propertyCategory];
          
          if (!currentSubType) return null;

          return (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">{currentSubType.title}</h3>
              <div className="flex flex-wrap gap-3">
                {currentSubType.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFormData({...formData, propertySubType: option})}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                      formData.propertySubType === option
                        ? "bg-blue-50 border-[#0066FF] text-[#0066FF]"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {formData.bedrooms === "5+" && (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="No. of Bedrooms"
                  value={formData.bedroomsCount}
                  onChange={(e) => setFormData({ ...formData, bedroomsCount: e.target.value })}
                  className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                />
              )}
            </div>
          );
        })()
      )}

      {/* Looking To Section (Moved to Bottom) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Looking to <span className="text-red-500">*</span></h3>
        <div className="flex flex-wrap gap-3 md:gap-4">
          {[
            { label: "Rent", value: "rent" },
            { label: "Sell", value: "sell" },
            { label: "PG/Co-living", value: "pg" }
          ].filter(opt => formData.propertyType === 'residential' || opt.value !== 'pg').map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                const newType = option.value as "sell" | "rent" | "pg";
                setLookingTo(newType);
                
                let newCategory = formData.propertyCategory;
                // Reset category logic based on new type
                if (newType === "rent" && formData.propertyCategory === "Plot / Land") {
                    newCategory = "Flat/Apartment";
                }
                if (newType === "pg") {
                    newCategory = "Paying Guest";
                    // PG is strictly residential
                    if (formData.propertyType !== "residential") {
                        setFormData({ ...formData, type: newType, propertyType: "residential", propertyCategory: newCategory });
                        return;
                    }
                }

                setFormData({ ...formData, type: newType, propertyCategory: newCategory });
              }}
              className={`px-4 md:px-8 py-3 rounded-lg text-sm md:text-base font-medium transition-all flex-1 min-w-[90px] sm:min-w-[120px] ${
                lookingTo === option.value
                  ? "bg-blue-50 text-[#0066FF] border border-blue-50" 
                  : errors.type 
                    ? "bg-white border border-red-500 text-gray-900"
                    : "bg-white border border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
            </div>
            {formData.bathrooms === "4+" && (
              <input
                type="text"
                inputMode="numeric"
                placeholder={formData.propertyType === "commercial" ? "No. of Washrooms" : "No. of Bathrooms"}
                value={formData.bathroomsCount}
                onChange={(e) => setFormData({ ...formData, bathroomsCount: e.target.value })}
                className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              />
            )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-bold text-[#000929] mb-4">Location Details</h3>
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm text-gray-600 font-medium">City / Location <span className="text-red-500">*</span></label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loadingLocation}
            className="text-sm text-[#0085FF] font-medium hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loadingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            Use Current Location
          </button>
        </div>
        <div className="relative">
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <input
              ref={autocompleteInputRef}
              type="text"
              required
              className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.location ? "border-red-500" : "border-gray-300"}`}
              defaultValue={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Search for a location"
            />
          ) : (
            <div>
              <input
                type="text"
                required
                className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.location ? "border-red-500" : "border-gray-300"}`}
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Mumbai, India"
              />
              <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                <span>⚠️</span> Location suggestions unavailable (API Key missing)
              </p>
            </div>
          )}
        </div>
      </div>

      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="hidden">
           {/* Map container removed as per user request */}
           <div ref={mapContainerRef}></div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Property Profile Header */}
      
      {/* Check if it's Land/Plot type */}
      {(formData.propertyCategory.includes("Land") || formData.propertyCategory.includes("Plot")) ? (
        <>
           {/* Add Area Details */}
           <div>
             <div className="flex items-center gap-2 mb-4">
               <h3 className="text-lg font-bold text-[#000929]">Add Area Details <span className="text-red-500">*</span></h3>
               <div className="text-gray-400 cursor-help" title="Enter the total area of the plot">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
               </div>
             </div>
             <div className={`flex gap-0 border rounded-lg overflow-hidden ${errors.plotArea ? "border-red-500" : "border-gray-300"}`}>
               <input
                 type="text"
                 required
                 className="flex-1 p-3 bg-white focus:outline-none focus:bg-blue-50 text-gray-900 border-r border-gray-300"
                 value={formData.plotArea}
                 onChange={e => setFormData({...formData, plotArea: e.target.value, area: e.target.value})}
                 placeholder="Plot Area"
               />
               <select
                 className="w-32 p-3 bg-gray-50 text-gray-700 focus:outline-none font-medium"
                 value={formData.units}
                 onChange={e => setFormData({...formData, units: e.target.value})}
               >
                 <option value="sqft">sq.ft.</option>
                 <option value="sqyards">sq.yards</option>
                <option value="gaj">gaj</option>
                 <option value="sqm">sq.m.</option>
                 <option value="acres">acres</option>
                 <option value="marla">marla</option>
                 <option value="cents">cents</option>
                 <option value="bigha">bigha</option>
                 <option value="kottah">kottah</option>
                 <option value="kanal">kanal</option>
                 <option value="grounds">grounds</option>
                 <option value="ares">ares</option>
                 <option value="biswa">biswa</option>
                 <option value="guntha">guntha</option>
                 <option value="aankadam">aankadam</option>
                 <option value="hectares">hectares</option>
                 <option value="rood">rood</option>
                 <option value="chataks">chataks</option>
                 <option value="perch">perch</option>
               </select>
             </div>
           </div>

           {/* Property Dimensions */}
            <div>
              <h3 className="text-lg font-bold text-[#000929] mb-4">Property Dimensions</h3>
              <div className="space-y-4">
                <input
                  type="number"
                  className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.plotLength ? "border-red-500" : "border-gray-300"}`}
                  value={formData.plotLength}
                  onChange={e => setFormData({...formData, plotLength: e.target.value})}
                  placeholder="Length of plot (in Ft.)"
                />
                <input
                  type="number"
                  className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.plotBreadth ? "border-red-500" : "border-gray-300"}`}
                  value={formData.plotBreadth}
                  onChange={e => setFormData({...formData, plotBreadth: e.target.value})}
                  placeholder="Breadth of plot (in Ft.)"
                />
             </div>
           </div>

           {/* Floors Allowed */}
           {!(formData.propertyCategory.includes("Agricultural") || formData.propertySubType?.includes("Agricultural")) && (
             <>
               <div>
                <h3 className="text-lg font-bold text-[#000929] mb-4">Floors Allowed For Construction</h3>
                 <input
                   type="number"
                   className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.floorsAllowed ? "border-red-500" : "border-gray-300"}`}
                   value={formData.floorsAllowed}
                   onChange={e => setFormData({...formData, floorsAllowed: e.target.value})}
                   placeholder="No. of floors"
                 />
               </div>

               {/* Boundary Wall */}
               <div>
                <h3 className="text-lg font-bold text-[#000929] mb-4">Is there a boundary wall around the property?</h3>
                 <div className="flex gap-3">
                   {["Yes", "No"].map(opt => (
                     <button
                       key={opt}
                       type="button"
                       onClick={() => setFormData({...formData, boundaryWall: opt as "Yes" | "No"})}
                       className={`px-4 md:px-6 py-2 rounded-full border text-sm font-medium transition-all ${
                         formData.boundaryWall === opt
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                           : `bg-white ${errors.boundaryWall ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Open Sides */}
               <div>
                 <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-[#000929]">No. of open sides</h3>
                   <div className="text-gray-400 cursor-help" title="Number of sides open to road/street">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                   </div>
                 </div>
                 <div className="flex gap-3">
                   {["1", "2", "3", "3+"].map(opt => (
                     <button
                       key={opt}
                       type="button"
                       onClick={() => setFormData({...formData, openSides: opt})}
                       className={`w-10 h-10 md:w-12 md:h-12 rounded-full border text-sm font-medium flex items-center justify-center transition-all ${
                         formData.openSides === opt
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                           : `bg-white ${errors.openSides ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Any Construction */}
               <div>
                 <div className="flex items-center gap-2 mb-4">
                   <h3 className="text-lg font-bold text-[#000929]">Any construction done on this property?</h3>
                    <div className="text-gray-400 cursor-help" title="Is there any existing structure?">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                   </div>
                 </div>
                 <div className="flex gap-3">
                   {["Yes", "No"].map(opt => (
                     <button
                       key={opt}
                       type="button"
                       onClick={() => setFormData({...formData, anyConstruction: opt as "Yes" | "No"})}
                       className={`px-4 md:px-6 py-2 rounded-full border text-sm font-medium transition-all ${
                         formData.anyConstruction === opt
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                           : `bg-white ${errors.anyConstruction ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Possession By */}
               <div>
                <h3 className="text-lg font-bold text-[#000929] mb-4">Possession By</h3>
                 <div className="flex flex-wrap gap-3">
                   {[
                     "Immediate", 
                     "Within 3 Months", 
                     "Within 6 Months", 
                     ...(formData.possessionBy && !["Immediate", "Within 3 Months", "Within 6 Months", "Select Year +"].includes(formData.possessionBy) ? [formData.possessionBy] : []),
                     "Select Year +"
                   ].map(opt => (
                     <button
                       key={opt}
                       type="button"
                       onClick={() => {
                         if (opt === "Select Year +") {
                           setPossessionPickerOpen(true);
                           setFormData({...formData, possessionBy: ""});
                         } else {
                           setPossessionPickerOpen(false);
                           setFormData({...formData, possessionBy: opt});
                         }
                       }}
                       className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                         formData.possessionBy === opt
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                           : `bg-white ${errors.possessionBy ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
                  {possessionPickerOpen && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <select
                          value={possessionYear}
                          onChange={(e) => setPossessionYear(e.target.value)}
                          className="p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent"
                        >
                          <option value="">Select Year</option>
                          {Array.from({length: 7}).map((_, idx) => {
                            const year = new Date().getFullYear() + idx;
                            return <option key={year} value={String(year)}>{year}</option>;
                          })}
                        </select>
                      </div>
                      {possessionYear && (
                        <div className="flex flex-wrap gap-2">
                          {MONTHS.map(m => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, possessionBy: `${m} ${possessionYear}`});
                                setPossessionPickerOpen(false);
                              }}
                              className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                                `${m} ${possessionYear}` === formData.possessionBy
                                  ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                                  : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
               </div>
             </>
           )}
        </>
      ) : (
        /* Regular Residential / Commercial UI */
        <>
        <h3 className="text-lg font-bold text-[#000929] mb-4">Property Profile</h3>
        
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6`}>
          {formData.propertyType === "residential" && (
            <>
            <div>
              <label className="block text-sm mb-2 text-gray-600 font-medium">Bedrooms</label>
              <div className="flex gap-2">
                {["1", "2", "3", "4", "5+"].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      bedrooms: num,
                      bedroomsCount: num === "5+" ? (formData.bedroomsCount || "") : ""
                    })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.bedrooms === num
                        ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                        : `bg-white ${errors.bedrooms ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {formData.bedrooms === "5+" && (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="No. of Bedrooms"
                  value={formData.bedroomsCount}
                  onChange={(e) => setFormData({ ...formData, bedroomsCount: e.target.value })}
                  className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                />
              )}
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-600 font-medium">Balconies</label>
              <div className="flex gap-2">
                {["0", "1", "2", "3+"].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      balconies: num,
                      balconiesCount: num === "3+" ? (formData.balconiesCount || "") : ""
                    })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.balconies === num
                        ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                        : errors.balconies
                          ? "bg-white border-red-500 text-gray-500"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {formData.balconies === "3+" && (
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="No. of Balconies"
                  value={formData.balconiesCount}
                  onChange={(e) => setFormData({ ...formData, balconiesCount: e.target.value })}
                  className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                />
              )}
            </div>
            </>
          )}
         
        <div>
            <label className="block text-sm mb-2 text-gray-600 font-medium">{formData.propertyType === "commercial" ? "Washrooms" : "Bathrooms"} <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {["1", "2", "3", "4+"].map(num => (
                <button
                 key={num}
                 type="button"
                 onClick={() => setFormData({
                   ...formData, 
                   bathrooms: num,
                   bathroomsCount: num === "4+" ? (formData.bathroomsCount || "") : ""
                 })}
                 className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                   formData.bathrooms === num
                     ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                     : `bg-white ${errors.bathrooms ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                 }`}
               >
                 {num}
               </button>
              ))}
            </div>
            {formData.bathrooms === "4+" && (
              <input
                type="text"
                inputMode="numeric"
                placeholder={formData.propertyType === "commercial" ? "No. of Washrooms" : "No. of Bathrooms"}
                value={formData.bathroomsCount}
                onChange={(e) => setFormData({ ...formData, bathroomsCount: e.target.value })}
                className="mt-2 w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              />
            )}
        </div>
        </div>


        <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Furnishing Status</label>
             <div className="flex flex-wrap gap-2 md:gap-3">
               {["Fully Furnished", "Semi-Furnished", "Unfurnished"].map(status => (
                 <button
                   key={status}
                   type="button"
                   onClick={() => setFormData({...formData, furnishingStatus: status === "Fully Furnished" ? "furnished" : status === "Semi-Furnished" ? "semi-furnished" : "unfurnished"})}
                   className={`px-3 md:px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 flex-1 min-w-[130px] ${
                    formData.furnishingStatus === (status === "Fully Furnished" ? "furnished" : status === "Semi-Furnished" ? "semi-furnished" : "unfurnished")
                      ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                      : errors.furnishingStatus 
                        ? "bg-white border-red-500 text-gray-500"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                 >
                   <Sofa className="w-3.5 h-3.5 md:w-4 md:h-4" />
                   {status}
                 </button>
               ))}
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Carpet Area <span className="text-red-500">*</span></label>
             <div className="flex gap-2">
               <input
                 type="text"
                 required
                 className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.area ? "border-red-500" : "border-gray-300"}`}
                 value={formData.area}
                 onChange={e => setFormData({...formData, area: e.target.value})}
                 placeholder="Size"
               />
               <select
                 className="w-24 p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
                 value={formData.units}
                 onChange={e => setFormData({...formData, units: e.target.value})}
               >
                 <option value="sqft">Sq.ft</option>
                <option value="sqyards">Sq.yrd</option>
                <option value="gaj">Gaj</option>
                <option value="sqm">Sq.m</option>
                <option value="acres">Acres</option>
                <option value="marla">Marla</option>
                <option value="cents">Cents</option>
                <option value="bigha">Bigha</option>
                <option value="kottah">Kottah</option>
                <option value="kanal">Kanal</option>
                <option value="grounds">Grounds</option>
                <option value="ares">Ares</option>
                <option value="biswa">Biswa</option>
                <option value="guntha">Guntha</option>
                <option value="aankadam">Aankadam</option>
                <option value="hectares">Hectares</option>
                <option value="rood">Rood</option>
                <option value="chataks">Chataks</option>
                <option value="perch">Perch</option>
               </select>
             </div>
           </div>
       </div>
        
        {formData.propertyType === "residential" && (
          <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Other Rooms</label>
             <div className="flex flex-wrap gap-3">
               {["Pooja Room", "Study Room", "Servant Room", "Store Room"].map(room => (
                 <button
                   key={room}
                   type="button"
                   onClick={() => {
                     const current = formData.otherRooms || [];
                     if (current.includes(room)) {
                       setFormData({...formData, otherRooms: current.filter(r => r !== room)});
                     } else {
                       setFormData({...formData, otherRooms: [...current, room]});
                     }
                   }}
                   className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                     (formData.otherRooms || []).includes(room)
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                   }`}
                 >
                   {room}
                 </button>
               ))}
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm mb-2 text-gray-600 font-medium">Reserved Parking <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-4">
                 {/* Covered Parking Counter */}
                 <div>
                   <span className="text-xs text-gray-500 block mb-1">Covered Parking</span>
                   <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                     <button 
                       type="button"
                       onClick={() => {
                         const val = parseInt(formData.coveredParking || "0");
                         if (val > 0) setFormData({...formData, coveredParking: String(val - 1)});
                       }}
                       className="px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-l-lg"
                     >
                       -
                     </button>
                     <input 
                       type="text" 
                       value={formData.coveredParking || "0"}
                       readOnly
                       className="w-full text-center text-gray-900 font-medium focus:outline-none"
                     />
                     <button 
                       type="button"
                       onClick={() => {
                         const val = parseInt(formData.coveredParking || "0");
                         setFormData({...formData, coveredParking: String(val + 1)});
                       }}
                       className="px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-r-lg"
                     >
                       +
                     </button>
                   </div>
                 </div>
                 
                 {/* Open Parking Counter */}
                 <div>
                   <span className="text-xs text-gray-500 block mb-1">Open Parking</span>
                   <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                     <button 
                       type="button"
                       onClick={() => {
                         const val = parseInt(formData.openParking || "0");
                         if (val > 0) setFormData({...formData, openParking: String(val - 1)});
                       }}
                       className="px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-l-lg"
                     >
                       -
                     </button>
                     <input 
                       type="text" 
                       value={formData.openParking || "0"}
                       readOnly
                       className="w-full text-center text-gray-900 font-medium focus:outline-none"
                     />
                     <button 
                       type="button"
                       onClick={() => {
                         const val = parseInt(formData.openParking || "0");
                         setFormData({...formData, openParking: String(val + 1)});
                       }}
                       className="px-3 py-2 text-gray-500 hover:bg-gray-50 rounded-r-lg"
                     >
                       +
                     </button>
                   </div>
                 </div>
              </div>
            </div>
            
            <div>
               <label className="block text-sm mb-2 text-gray-600 font-medium">Floor Details</label>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <select
                     className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.totalFloors ? "border-red-500" : "border-gray-300"}`}
                     value={formData.totalFloors}
                     onChange={e => setFormData({...formData, totalFloors: e.target.value})}
                   >
                     <option value="">Total Floors</option>
                     {Array.from({length: 50}, (_, i) => i + 1).map(num => (
                       <option key={num} value={num}>{num}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <select
                     className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.floorNumber ? "border-red-500" : "border-gray-300"}`}
                     value={formData.floorNumber}
                     onChange={e => setFormData({...formData, floorNumber: e.target.value})}
                   >
                     <option value="">Floor No.</option>
                     {Array.from({length: parseInt(String(formData.totalFloors || "50"))}, (_, i) => i + 1).map(num => (
                       <option key={num} value={num}>{num}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>
        </div>

        {formData.type === 'rent' && (
          <>
            <div className="mb-6">
              <label className="block text-sm mb-2 text-gray-600 font-medium">Available from <span className="text-red-500">*</span></label>
              <input
                type="date"
                className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.availableFrom ? "border-red-500" : "border-gray-300"}`}
                value={formData.availableFrom}
                onChange={e => setFormData({...formData, availableFrom: e.target.value})}
              />
            </div>

            {formData.propertyType === 'residential' && (
            <div className="mb-6">
               <label className="block text-sm mb-2 text-gray-600 font-medium">Willing to rent out to <span className="text-red-500">*</span></label>
               <div className="flex flex-wrap gap-3">
                 {["Family", "Single men", "Single women"].map(tenant => (
                   <button
                     key={tenant}
                     type="button"
                     onClick={() => {
                       const current = formData.preferredTenants || [];
                       if (current.includes(tenant)) {
                          setFormData({...formData, preferredTenants: current.filter(t => t !== tenant)});
                       } else {
                          setFormData({...formData, preferredTenants: [...current, tenant]});
                       }
                     }}
                     className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                       (formData.preferredTenants || []).includes(tenant)
                         ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                         : errors.preferredTenants
                            ? "bg-white border-red-500 text-gray-500"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                     }`}
                   >
                     <span className="text-lg">+</span> {tenant}
                   </button>
                 ))}
               </div>
            </div>
            )}
          </>
        )}

        <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Availability Status</label>
             <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
               {["Ready to move", "Under construction"].map(status => (
                 <button
                   key={status}
                   type="button"
                   onClick={() => setFormData({...formData, availabilityStatus: status})}
                   className={`px-3 md:px-4 py-2 rounded-full border text-xs md:text-sm font-medium transition-all flex-1 min-w-[140px] whitespace-nowrap ${
                    formData.availabilityStatus === status
                      ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                      : errors.availabilityStatus
                        ? "bg-white border-red-500 text-gray-500"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                 >
                   {status}
                 </button>
               ))}
             </div>
             
             {formData.availabilityStatus === "Ready to move" && (
               <div>
                 <label className="block text-sm mb-2 text-gray-600 font-medium">Age of Property <span className="text-red-500">*</span></label>
                 <div className="flex flex-wrap gap-3">
                   {["0-1 Years", "1-5 Years", "5-10 Years", "10+ Years"].map(age => (
                     <button
                       key={age}
                       type="button"
                       onClick={() => setFormData({...formData, ageOfProperty: age})}
                       className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.ageOfProperty === age
                          ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                          : errors.ageOfProperty
                            ? "bg-white border-red-500 text-gray-500"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                     >
                       {age}
                     </button>
                   ))}
                 </div>
               </div>
             )}

             {formData.availabilityStatus === "Under construction" && (
               <div>
                 <label className="block text-sm mb-2 text-gray-600 font-medium">Possession By <span className="text-red-500">*</span></label>
                 <div className="flex flex-wrap gap-3">
                  {[
                   "Dec 2024", 
                   "Jan 2025", 
                   "Feb 2025", 
                   "Mar 2025", 
                   "Apr 2025", 
                   ...(formData.possessionBy && !["Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "Select Year +"].includes(formData.possessionBy) ? [formData.possessionBy] : []),
                   "Select Year +"
                 ].map(date => (
                     <button
                       key={date}
                       type="button"
                      onClick={() => {
                        if (date === "Select Year +") {
                          setPossessionPickerOpen(true);
                          setFormData({...formData, possessionBy: ""});
                        } else {
                          setPossessionPickerOpen(false);
                          setFormData({...formData, possessionBy: date});
                        }
                      }}
                       className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                        formData.possessionBy === date
                          ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                          : errors.possessionBy
                            ? "bg-white border-red-500 text-gray-500"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                     >
                       {date}
                     </button>
                   ))}
                 </div>
                {possessionPickerOpen && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <select
                        value={possessionYear}
                        onChange={(e) => setPossessionYear(e.target.value)}
                        className="p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent"
                      >
                        <option value="">Select Year</option>
                        {Array.from({length: 7}).map((_, idx) => {
                          const year = new Date().getFullYear() + idx;
                          return <option key={year} value={String(year)}>{year}</option>;
                        })}
                      </select>
                    </div>
                    {possessionYear && (
                      <div className="flex flex-wrap gap-2">
                        {MONTHS.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, possessionBy: `${m} ${possessionYear}`});
                              setPossessionPickerOpen(false);
                            }}
                            className={`px-3 py-2 rounded-full border text-xs font-medium transition-all ${
                              `${m} ${possessionYear}` === formData.possessionBy
                                ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
               </div>
             )}
        </div>
        </>
      )}



      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">Description</label>
        <textarea
          className={`w-full p-4 rounded-xl bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 h-32 resize-none ${errors.description ? "border-red-500" : "border-gray-300"}`}
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Tell us more about the property..."
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-lg font-bold text-[#000929]">Photos <span className="text-red-500">*</span></h3>
         <span className="text-sm text-gray-500">Add photos</span>
      </div>
      
      <div className={`border-2 border-dashed rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors ${errors.images ? "border-red-500" : "border-gray-300"}`}
         onDragOver={e => e.preventDefault()}
         onDrop={e => {
           e.preventDefault();
           const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
           if (files.length) handleFilesAdd(files);
         }}
      >
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-blue-100 text-[#0085FF] rounded-full flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
             </svg>
          </div>
        </div>
        <p className="text-gray-900 font-medium mb-1">Drag and drop photos here</p>
        <p className="text-sm text-gray-500 mb-4">Supported formats: JPG, PNG</p>
        <label className="cursor-pointer bg-[#0085FF] hover:bg-[#006ACC] text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-block">
          Browse Files
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => {
              if (e.target.files) handleFilesAdd(Array.from(e.target.files));
            }}
            className="hidden"
          />
        </label>
      </div>

      {(images.length > 0 || existingImages.length > 0) && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3">Selected Photos ({images.length + existingImages.length})</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewUrls.map((url, idx) => {
              const selectedGlobalIndex = coverSelection
                ? (coverSelection.source === 'existing' ? coverSelection.index : existingImages.length + coverSelection.index)
                : -1;
              const isCover = idx === selectedGlobalIndex;
              return (
                <div key={idx} className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 group ${isCover ? "border-[#0085FF] ring-2 ring-blue-100" : "border-gray-200"}`}>
                  <Image src={url} alt={`preview-${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute top-2 right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {isCover ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-[#0085FF] text-white text-xs py-1 text-center font-medium">
                      Cover Image
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (idx < existingImages.length) {
                          setCoverSelection({ source: 'existing', index: idx });
                        } else {
                          setCoverSelection({ source: 'new', index: idx - existingImages.length });
                        }
                      }}
                      className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-[#0085FF] text-xs px-3 py-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                    >
                      Set as Cover
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-lg font-bold text-[#000929] mb-4">Property Video</h3>
        <div className="flex items-center gap-4">
           <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
             </svg>
             {video || existingVideo ? "Change Video" : "Add Video"}
             <input
               type="file"
               accept="video/*"
               onChange={e => {
                 if (e.target.files && e.target.files[0]) {
                   setVideo(e.target.files[0]);
                 }
               }}
               className="hidden"
             />
           </label>
           {(video || existingVideo) && (
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {video ? video.name : "Existing video selected"}
              </span>
           )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-lg font-bold text-[#000929] mb-4">Floor Plan</h3>
        <div className="flex items-center gap-4">
           <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 011.414.586l5.414 5.414a1 1 0 01.586 1.414V19a2 2 0 01-2 2z" />
             </svg>
             {floorPlan || existingFloorPlan ? "Change Floor Plan" : "Add Floor Plan"}
             <input
               type="file"
               accept="image/*"
               onChange={e => {
                 if (e.target.files && e.target.files[0]) {
                   setFloorPlan(e.target.files[0]);
                 }
               }}
               className="hidden"
             />
           </label>
           {(floorPlan || existingFloorPlan) && (
              <span className="text-sm text-gray-600 truncate max-w-xs">
                {floorPlan ? floorPlan.name : "Existing floor plan selected"}
              </span>
           )}
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Ownership Section */}
      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">Ownership</label>
        <div className="flex flex-wrap gap-3">
          {["Freehold", "Leasehold", "Co-operative society", "Power of Attorney"].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({...formData, ownership: type})}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                formData.ownership === type
                  ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                  : errors.ownership 
                    ? "bg-white border-red-500 text-gray-500"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">Additional Features</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           {/* Facing */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Facing</label>
             <select
               className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.facing ? "border-red-500" : "border-gray-300"}`}
               value={formData.facing}
               onChange={e => setFormData({...formData, facing: e.target.value})}
             >
               <option value="">Select Facing</option>
               {["East", "West", "North", "South", "North-East", "North-West", "South-East", "South-West"].map(f => (
                 <option key={f} value={f}>{f}</option>
               ))}
             </select>
           </div>
           
           {/* Overlooking */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Overlooking</label>
             <div className="flex flex-wrap gap-2">
               {["Pool", "Park", "Main Road", "Club"].map(opt => {
                 let Icon = Trees;
                 if (opt === "Pool") Icon = Waves;
                 if (opt === "Main Road") Icon = Car;
                 if (opt === "Club") Icon = Coffee;
                 return (
                 <button
                   key={opt}
                   type="button"
                   onClick={() => {
                     const current = formData.overlooking || [];
                     if (current.includes(opt)) {
                       setFormData({...formData, overlooking: current.filter(o => o !== opt)});
                     } else {
                       setFormData({...formData, overlooking: [...current, opt]});
                     }
                   }}
                   className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                     (formData.overlooking || []).includes(opt)
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : errors.overlooking
                          ? "bg-white border-red-500 text-gray-500"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                   }`}
                 >
                   <Icon className="w-3.5 h-3.5" />
                   {opt}
                 </button>
               )})}
             </div>
           </div>

           {/* Water Source */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Water Source</label>
             <div className="flex flex-wrap gap-2">
               {["Municipal corporation", "Borewell/Tank", "24*7 Water"].map(opt => (
                 <button
                   key={opt}
                   type="button"
                   onClick={() => {
                     const current = formData.waterSource || [];
                     if (current.includes(opt)) {
                       setFormData({...formData, waterSource: current.filter(w => w !== opt)});
                     } else {
                       setFormData({...formData, waterSource: [...current, opt]});
                     }
                   }}
                   className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                     (formData.waterSource || []).includes(opt)
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : errors.waterSource
                          ? "bg-white border-red-500 text-gray-500"
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                   }`}
                 >
                   <Droplets className="w-3.5 h-3.5" />
                   {opt}
                 </button>
               ))}
             </div>
           </div>

           {/* Flooring */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Flooring</label>
             <select
               className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.flooring ? "border-red-500" : "border-gray-300"}`}
               value={formData.flooring}
               onChange={e => setFormData({...formData, flooring: e.target.value})}
             >
               <option value="">Select Flooring</option>
               {["Vitrified", "Marble", "Wooden", "Ceramic", "Mosaic", "Granite"].map(f => (
                 <option key={f} value={f}>{f}</option>
               ))}
             </select>
           </div>

           {/* Power Backup */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Power Backup</label>
             <select
               className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900 ${errors.powerBackup ? "border-red-500" : "border-gray-300"}`}
               value={formData.powerBackup}
               onChange={e => setFormData({...formData, powerBackup: e.target.value})}
             >
               <option value="">Select Power Backup</option>
               {["None", "Partial", "Full"].map(p => (
                 <option key={p} value={p}>{p}</option>
               ))}
             </select>
           </div>

           {/* Width of Facing Road */}
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Width of facing road</label>
             <div className="flex gap-2">
               <input
                 type="text"
                 className={`w-full p-2.5 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.facingRoadWidth ? "border-red-500" : "border-gray-300"}`}
                 value={formData.facingRoadWidth}
                 onChange={e => setFormData({...formData, facingRoadWidth: e.target.value})}
                 placeholder="Width"
               />
               <select
                 className="w-24 p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
                 value={formData.facingRoadUnit}
                 onChange={e => setFormData({...formData, facingRoadUnit: e.target.value})}
               >
                 <option value="Meter">Meter</option>
                 <option value="Feet">Feet</option>
               </select>
             </div>
           </div>
        </div>
      </div>

      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">Amenities & Features</label>
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-2 rounded-xl`}>
          {(formData.propertyType === "residential" ? [
            "Parking", "Swimming Pool", "Gym", "Garden", 
            "Balcony", "Elevator", "Security", "Power Backup", 
            "Water Supply", "Internet", "AC", "Furnished"
          ] : [
            "Parking", "Elevator", "Security", "Power Backup", 
            "Water Supply", "Internet", "Central AC", "Furnished", 
            "CCTV", "Fire Safety", "Cafeteria", "Reception"
          ]).map(feature => (
            <label key={feature} className="flex items-center text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
              <input
                type="checkbox"
                className="w-4 h-4 mr-3 rounded accent-[#0085FF]"
                checked={formData.features.includes(feature)}
                onChange={e => {
                  if (e.target.checked) {
                    setFormData({...formData, features: [...formData.features, feature]});
                  } else {
                    setFormData({...formData, features: formData.features.filter(f => f !== feature)});
                  }
                }}
              />
              <span className="select-none">{feature}</span>
            </label>
          ))}
        </div>
        <input
          type="text"
          className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
          placeholder="Add custom features (press Enter to add)"
          onKeyPress={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const customFeature = (e.target as HTMLInputElement).value.trim();
              if (customFeature && !formData.features.includes(customFeature)) {
                setFormData({...formData, features: [...formData.features, customFeature]});
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
        {formData.features.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.features.map((feature, index) => (
              <span key={index} className="bg-blue-50 text-[#0085FF] border border-blue-100 px-3 py-1 rounded-full text-sm flex items-center">
                {feature}
                <button
                  type="button"
                  onClick={() => setFormData({...formData, features: formData.features.filter((_, i) => i !== index)})}
                  className="ml-2 text-[#0085FF] hover:text-red-500 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>


      <div>
        <h3 className="text-lg font-bold text-[#000929] mb-4">Pricing Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Expected Price <span className="text-red-500">*</span></label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
               <input
                 type="text"
                 inputMode="numeric"
                 pattern="[0-9]*"
                 required
                 className={`w-full pl-8 p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.price ? "border-red-500" : "border-gray-300"}`}
                 value={formData.price}
                 onChange={e => {
                   const value = e.target.value;
                   if (value === '' || /^\d+$/.test(value)) {
                     setFormData({...formData, price: value});
                   }
                 }}
                 placeholder="Enter amount"
               />
             </div>
           </div>
           {/* Price per sq.ft. removed */}
        </div>
        
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.allInclusivePrice}
              onChange={e => setFormData({...formData, allInclusivePrice: e.target.checked})}
              className="w-4 h-4 rounded accent-[#0085FF]"
            />
            <span className="text-sm text-gray-700">All inclusive price</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.taxExcluded}
              onChange={e => setFormData({...formData, taxExcluded: e.target.checked})}
              className="w-4 h-4 rounded accent-[#0085FF]"
            />
            <span className="text-sm text-gray-700">Tax and Govt. charges excluded</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.priceNegotiable}
              onChange={e => setFormData({...formData, priceNegotiable: e.target.checked})}
              className="w-4 h-4 rounded accent-[#0085FF]"
            />
            <span className="text-sm text-gray-700">Price Negotiable</span>
          </label>
        </div>

        {(!['rent', 'pg'].includes(formData.type?.toLowerCase()) && (formData.propertyCategory?.includes('Land') || formData.propertyCategory?.includes('Plot'))) && (
        <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Price Unit (if applicable)</label>
             <select
               className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
               value={formData.priceUnit}
               onChange={e => setFormData({...formData, priceUnit: e.target.value})}
            >
              <option value="per_month">Month</option>
              <option value="per_year">Year</option>
              <option value="per_sqft">Sq. Ft.</option>
              <option value="per_sqyards">Sq. Yards</option>
              <option value="per_sqm">Sq. M.</option>
              <option value="per_acre">Acre</option>
              <option value="per_marla">Marla</option>
              <option value="per_cents">Cents</option>
              <option value="per_bigha">Bigha</option>
              <option value="per_kottah">Kottah</option>
              <option value="per_kanal">Kanal</option>
              <option value="per_grounds">Grounds</option>
              <option value="per_ares">Ares</option>
              <option value="per_biswa">Biswa</option>
              <option value="per_guntha">Guntha</option>
              <option value="per_aankadam">Aankadam</option>
              <option value="per_hectares">Hectares</option>
              <option value="per_rood">Rood</option>
              <option value="per_chataks">Chataks</option>
              <option value="per_perch">Perch</option>
            </select>
           </div>
        )}
      </div>
      
      <div>
         <label className="block text-sm mb-2 text-gray-600 font-medium">Property Title (Auto-generated or Custom) <span className="text-red-500">*</span></label>
         <input
           type="text"
           required
           className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.title ? "border-red-500" : "border-gray-300"}`}
           value={formData.title}
           onChange={e => setFormData({...formData, title: e.target.value})}
           placeholder="e.g. 3 BHK Luxury Apartment in Bandra West"
         />
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-bold text-[#000929] mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-gray-600 font-medium">Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.OwnerName ? "border-red-500" : "border-gray-300"}`}
              value={formData.OwnerName}
              onChange={e => setFormData({...formData, OwnerName: e.target.value})}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-600 font-medium">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              required
              className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.phone ? "border-red-500" : "border-gray-300"}`}
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/[^\d]/g, '').slice(0, 10)})}
              inputMode="numeric"
              pattern="\\d{10}"
              maxLength={10}
              placeholder="Your contact number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-2 text-gray-600 font-medium">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              required
              className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.email ? "border-red-500" : "border-gray-300"}`}
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="Your email address"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-bold text-[#000929] mb-4">Preview & Publish</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preview Summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h4 className="font-semibold text-gray-900 mb-2">Property Summary</h4>
             <div className="space-y-2 text-sm text-gray-700">
               <p><span className="font-medium text-gray-500">Title:</span> {formData.title || '-'}</p>
               <p><span className="font-medium text-gray-500">Location:</span> {formData.location || '-'}</p>
               <p><span className="font-medium text-gray-500">Type:</span> {formData.propertyType} • {formData.propertyCategory}</p>
               <p><span className="font-medium text-gray-500">Looking to:</span> {formData.type}</p>
               <p><span className="font-medium text-gray-500">Area:</span> {formData.area || '-'} {formData.units}</p>
               <p><span className="font-medium text-gray-500">Price:</span> ₹{formData.price}</p>
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h4 className="font-semibold text-gray-900 mb-2">Contact Details</h4>
             <div className="space-y-2 text-sm text-gray-700">
               <p><span className="font-medium text-gray-500">Name:</span> {formData.OwnerName || '-'}</p>
               <p><span className="font-medium text-gray-500">Phone:</span> {formData.phone || '-'}</p>
               <p><span className="font-medium text-gray-500">Email:</span> {formData.email || '-'}</p>
             </div>
          </div>
        </div>

        {/* Media Preview */}
        <div>
           <h4 className="font-semibold text-gray-900 mb-2">Cover Image</h4>
           <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative">
             {previewUrls[0] ? (
               <img src={previewUrls[0]} alt="cover" className="w-full h-full object-cover" />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-500 text-sm">No image selected</div>
             )}
           </div>
           <p className="text-xs text-gray-500 mt-2 text-center">
             Total {previewUrls.length} images selected
           </p>
        </div>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
        <div className="bg-blue-100 p-2 rounded-full text-[#0066FF]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </div>
        <div>
          <h4 className="font-medium text-[#000929] text-sm">Ready to Publish?</h4>
          <p className="text-xs text-gray-600 mt-1">
            Review your details carefully. By clicking &quot;Post Property&quot;, you agree to our Terms and Conditions.
          </p>
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent accidental submission from earlier steps
    if (activeStep < 6) {
      return;
    }

    if (!validateStep(activeStep)) {
      setWarning("Please fill all mandatory fields marked with *");
      const errorElement = document.querySelector('.border-red-500');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setWarning(null);

    setLoading(true);

    try {
      // First, ensure user is authenticated
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (authError) {
        console.log("Authentication not required or already authenticated", authError);
      }
      const sellerId = auth.currentUser?.uid || null;

      const uploadImage = async (file: File) => {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const storageRef = ref(storage, `property_image/all_images/${unique}`);
        const toUpload = await standardizeImage(file, 1200, 900);
        return new Promise<string | null>(async (resolve) => {
          try {
            const task = uploadBytesResumable(storageRef, toUpload);
            const timeout = setTimeout(() => {
              try { task.cancel(); } catch {}
            }, 15000);
            task.on("state_changed",
              (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / Math.max(snapshot.totalBytes, 1)) * 100);
                setUploadProgress(pct);
              },
              async (err) => {
                try {
                  console.error("Upload error:", err);
                  await signInAnonymously(auth);
                  const snapshot2 = await uploadBytes(storageRef, toUpload);
                  const url2 = await getDownloadURL(snapshot2.ref);
                  clearTimeout(timeout);
                  resolve(url2);
                } catch {
                  clearTimeout(timeout);
                  resolve(null);
                }
              },
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                clearTimeout(timeout);
                resolve(url);
              }
            );
          } catch {
            try {
              await signInAnonymously(auth);
              const snapshot = await uploadBytes(storageRef, toUpload);
              const url = await getDownloadURL(snapshot.ref);
              resolve(url);
            } catch {
              resolve(null);
            }
          }
        });
      };

      let completed = 0;
      const results = await Promise.all(
        images.map(async (image) => {
          const url = await uploadImage(image);
          completed += 1;
          setUploadProgress(Math.round((completed / images.length) * 100));
          return url;
        })
      );
      const imageUrls = results;
      // Ensure unique, non-empty URLs and respect cover selection order
      const combined = [...existingImages, ...imageUrls.filter((u): u is string => !!u)];
      if (coverSelection) {
        const coverIndex = coverSelection.source === 'existing'
          ? coverSelection.index
          : existingImages.length + coverSelection.index;
        if (coverIndex >= 0 && coverIndex < combined.length) {
          const [cover] = combined.splice(coverIndex, 1);
          combined.unshift(cover);
        }
      }
      const allImages: string[] = [];
      for (const u of combined) {
        if (u && !allImages.includes(u)) allImages.push(u);
      }
      // Upload video if selected
      let finalVideoUrl = existingVideo;
      if (video) {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${video.name}`;
        const storageRef = ref(storage, `property_video/${unique}`);
        try {
          const snapshot = await uploadBytes(storageRef, video);
          finalVideoUrl = await getDownloadURL(snapshot.ref);
        } catch {
          try {
            await signInAnonymously(auth);
            const snapshot2 = await uploadBytes(storageRef, video);
            finalVideoUrl = await getDownloadURL(snapshot2.ref);
          } catch {
            finalVideoUrl = existingVideo ?? null;
          }
        }
      }
      
      // Upload floor plan if selected
      let finalFloorPlanUrl = existingFloorPlan;
      if (floorPlan) {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${floorPlan.name}`;
        const storageRef = ref(storage, `property_floor_plans/${unique}`);
        try {
          const snapshot = await uploadBytes(storageRef, floorPlan);
          finalFloorPlanUrl = await getDownloadURL(snapshot.ref);
        } catch {
          try {
            await signInAnonymously(auth);
            const snapshot2 = await uploadBytes(storageRef, floorPlan);
            finalFloorPlanUrl = await getDownloadURL(snapshot2.ref);
          } catch {
            finalFloorPlanUrl = existingFloorPlan ?? null;
          }
        }
      }

      const validUrls = allImages;

      // Allow property creation even if no images uploaded (use placeholder)
      if (validUrls.length === 0) {
        validUrls.push("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80");
      }

      // Normalize counts for plus selections
      const bedroomsVal = formData.bedrooms === "5+" 
        ? (formData.bedroomsCount ? Number(formData.bedroomsCount) : 5)
        : (formData.bedrooms ? Number(String(formData.bedrooms).replace(/[^\d]/g, "")) : null);
      const bathroomsVal = formData.bathrooms === "4+" 
        ? (formData.bathroomsCount ? Number(formData.bathroomsCount) : 4)
        : (formData.bathrooms ? Number(String(formData.bathrooms).replace(/[^\d]/g, "")) : null);
      const balconiesVal = formData.balconies === "3+" 
        ? (formData.balconiesCount ? Number(formData.balconiesCount) : 3)
        : (formData.balconies ? Number(String(formData.balconies).replace(/[^\d]/g, "")) : null);

      // Add to Firestore with standardized fields only
      const payload: Record<string, unknown> = {
        title: formData.title,
        location: formData.location,
        lat: formData.lat ?? null,
        lng: formData.lng ?? null,
        price: Number(formData.price),
        priceUnit: (!['rent', 'pg'].includes(formData.type?.toLowerCase()) && !(formData.propertyCategory?.includes('Land') || formData.propertyCategory?.includes('Plot'))) ? null : formData.priceUnit,
        ownership: formData.ownership,
        allInclusivePrice: formData.allInclusivePrice,
        taxExcluded: formData.taxExcluded,
        priceNegotiable: formData.priceNegotiable,
        uniqueDescription: formData.uniqueDescription,
        bedrooms: bedroomsVal,
        bathrooms: bathroomsVal,
        area: formData.area,
        units: formData.units,
        features: formData.features,
        description: formData.description,
        OwnerName: formData.OwnerName,
        phone: formData.phone,
        email: formData.email,
        type: formData.type,
        propertyType: formData.propertyType,
        propertyCategory: formData.propertyCategory,
        propertySubType: formData.propertySubType,
        balconies: balconiesVal,
        otherRooms: formData.otherRooms,
        coveredParking: formData.coveredParking,
        openParking: formData.openParking,
        availabilityStatus: formData.availabilityStatus,
        ageOfProperty: formData.ageOfProperty,
        facing: formData.facing,
        overlooking: formData.overlooking,
        waterSource: formData.waterSource,
        flooring: formData.flooring,
        powerBackup: formData.powerBackup,
        facingRoadWidth: formData.facingRoadWidth,
        facingRoadUnit: formData.facingRoadUnit,
        possessionBy: formData.possessionBy,
        furnishingStatus: formData.furnishingStatus,
        totalFloors: formData.totalFloors ? Number(formData.totalFloors) : null,
        floorNumber: formData.floorNumber ? Number(formData.floorNumber) : null,
        boundaryWall: formData.boundaryWall,
        openSides: formData.openSides,
        anyConstruction: formData.anyConstruction,
        plotArea: formData.plotArea ? Number(formData.plotArea) : null,
        plotLength: formData.plotLength ? Number(formData.plotLength) : null,
        plotBreadth: formData.plotBreadth ? Number(formData.plotBreadth) : null,
        floorsAllowed: formData.floorsAllowed ? Number(formData.floorsAllowed) : null,
        images: validUrls,
        videoUrl: finalVideoUrl || null,
        floorPlan: finalFloorPlanUrl || null,
        sellerId,
        userType: formData.userType,
        status: "active" as const
      };

      if (propertyId) {
         payload.updatedAt = serverTimestamp();
         await updateDoc(doc(db, "property_All", "main", "properties", propertyId), payload);
         alert("Property updated successfully!");
      } else {
         payload.createdAt = serverTimestamp();
         await addDoc(collection(db, "property_All", "main", "properties"), payload);
         alert("Property listed successfully!");
      }

      if (onSuccess) onSuccess();
      
      // Reset form
      if (!propertyId) {
        setFormData({
          title: "",
          location: "",
          lat: null,
          lng: null,
          price: "",
          bedrooms: "",
          bedroomsCount: "",
          bathrooms: "",
          bathroomsCount: "",
          area: "",
          priceUnit: "per_month",
          units: "sqft",
          features: [],
          description: "",
          OwnerName: "",
          phone: "",
          email: "",
          type: defaultType,
          propertyType: "residential",
          propertyCategory: "Flat/Apartment",
          totalFloors: "",
          floorNumber: "",
          furnishingStatus: "",
          builderFloorType: "Single Floor",
          plotArea: "",
          plotLength: "",
          plotBreadth: "",
          floorsAllowed: "",
          boundaryWall: "",
          openSides: "",
          anyConstruction: "",
          possessionBy: "",
          balconies: "",
          balconiesCount: "",
          otherRooms: [],
          coveredParking: "",
          openParking: "",
          availabilityStatus: "",
          ageOfProperty: "",
          facing: "",
          overlooking: [],
          waterSource: [],
          flooring: "",
          powerBackup: "",
          facingRoadWidth: "",
          facingRoadUnit: "Meter",
          ownership: "",
          allInclusivePrice: false,
          taxExcluded: false,
          priceNegotiable: false,
          uniqueDescription: "",
          availableFrom: "",
          preferredTenants: [],
          userType: "Owner",
          propertySubType: "",
        });
        setImages([]);
        setExistingImages([]);
        setVideo(null);
        setExistingVideo(null);
        setFloorPlan(null);
        setExistingFloorPlan(null);
      }

    } catch (error) {
      console.error("Error listing property:", error);
      alert("Error listing property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-gray-900 h-full flex flex-col">
      <div className="flex-1">
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
        {activeStep === 3 && renderStep3()}
        {activeStep === 4 && renderStep4()}
        {activeStep === 5 && renderStep5()}
        {activeStep === 6 && renderStep6()}
      </div>

      <div className="mt-8 flex flex-col pt-6 border-t border-gray-100">
        {warning && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {warning}
          </div>
        )}
        <div className="flex items-center gap-4">
        {activeStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        
        {activeStep < 6 ? (
          <button
            key="btn-next"
            type="button"
            onClick={handleNext}
            className="ml-auto px-8 py-2.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-medium transition-colors shadow-sm shadow-blue-200"
          >
            Next
          </button>
        ) : (
          <button
            key="btn-submit"
            type="submit"
            disabled={loading}
            className="ml-auto px-8 py-2.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-200"
          >
            {loading ? (propertyId ? "Updating..." : "Posting...") : (propertyId ? "Update Property" : "Post Property")}
          </button>
        )}
      </div>
      </div>
      
      {loading && images.length > 0 && (
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#0066FF] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-gray-600 text-sm">Uploading images… {uploadProgress}%</p>
        </div>
      )}
    </form>
  );
}
