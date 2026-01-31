"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, Loader2, Building2, Home, Users, Briefcase, Store, Map, Warehouse, Factory, Hotel, MoreHorizontal, Building, Armchair, LandPlot, Archive, Coffee, ArrowUp, Sprout, BedDouble, Bath, Car, Sofa, Ruler, Key, Compass, Waves, Trees, Droplets, Layers, Zap, Shield, Fan } from "lucide-react";
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
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    priceUnit: "per_month",
    units: "sqft",
    features: [] as string[],
    description: "",
    OwnerName: "",
    phone: "",
    email: "",
    type: defaultType,
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
    builtUpArea: "",
    superBuiltUpArea: "",
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
    pricePerSqFt: "",
    allInclusivePrice: false,
    taxExcluded: false,
    priceNegotiable: false,
    uniqueDescription: "",
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        location: initialData.location || "",
        lat: initialData.lat || null,
        lng: initialData.lng || null,
        price: initialData.price ? String(initialData.price) : "",
        bedrooms: initialData.bedrooms ? String(initialData.bedrooms) : "",
        bathrooms: initialData.bathrooms ? String(initialData.bathrooms) : "",
        area: initialData.area ? String(initialData.area) : "",
        priceUnit: initialData.priceUnit || "per_month",
        units: initialData.units || "sqft",
        features: initialData.features || [],
        description: initialData.description || "",
        OwnerName: initialData.OwnerName || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        type: initialData.type || defaultType,
        propertyType: initialData.propertyType || "residential",
        propertyCategory: initialData.propertyCategory || "Flat/Apartment",
        totalFloors: initialData.totalFloors || "",
        floorNumber: initialData.floorNumber || "",
        furnishingStatus: initialData.furnishingStatus || "",
        builderFloorType: "Single Floor",
        plotArea: initialData.area || "",
        balconies: initialData.balconies ? String(initialData.balconies) : "",
        builtUpArea: initialData.builtUpArea ? String(initialData.builtUpArea) : "",
        superBuiltUpArea: initialData.superBuiltUpArea ? String(initialData.superBuiltUpArea) : "",
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
        possessionBy: initialData.possessionBy || "",
        ownership: initialData.ownership || "",
        pricePerSqFt: initialData.pricePerSqFt ? String(initialData.pricePerSqFt) : "",
        allInclusivePrice: initialData.allInclusivePrice || false,
        taxExcluded: initialData.taxExcluded || false,
        priceNegotiable: initialData.priceNegotiable || false,
        uniqueDescription: initialData.uniqueDescription || "",
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
    if (!mapsReady || !mapContainerRef.current) return;
    if (mapRef.current) return;
    // Initialize map
    const center = {
      lat: formData.lat ?? 19.0760,
      lng: formData.lng ?? 72.8777
    };
    const googleObj = (window as unknown as {
      google?: {
        maps: {
          Map: new (el: HTMLElement, opts: unknown) => MapsLike;
          Marker: new (opts: unknown) => MarkerLike;
          Geocoder: new () => GeocoderLike;
          places: { Autocomplete: new (el: HTMLInputElement, opts: unknown) => AutocompleteLike };
          marker?: { AdvancedMarkerElement: new (opts: unknown) => MarkerLike };
        };
      };
    }).google!;
    mapRef.current = new googleObj.maps.Map(mapContainerRef.current!, {
      center,
      zoom: 12,
      disableDefaultUI: true
    });
    geocoderRef.current = new googleObj.maps.Geocoder();
    
    // Create standard draggable marker (avoids Advanced Marker mapId requirement)
    const marker = new googleObj.maps.Marker({
      map: mapRef.current,
      position: center,
      draggable: true
    });
    markerRef.current = marker;
    
    // Map click to set marker and reverse geocode
    mapRef.current.addListener("click", async (e: unknown) => {
      const evt = e as { latLng?: { lat: () => number; lng: () => number } };
      if (!evt.latLng) return;
      const lat = evt.latLng.lat();
      const lng = evt.latLng.lng();
      if (markerRef.current?.setPosition) {
        markerRef.current.setPosition({ lat, lng });
      } else if (markerRef.current) {
        markerRef.current.position = { lat, lng };
      }
      mapRef.current?.panTo({ lat, lng });
      setFormData(prev => ({ ...prev, lat, lng }));
      try {
        const geocode = await geocoderRef.current!.geocode({ location: { lat, lng } });
        const address = geocode.results?.[0]?.formatted_address;
        if (address) {
          setFormData(prev => ({ ...prev, location: address }));
          if (autocompleteInputRef.current) {
            autocompleteInputRef.current.value = address;
          }
        }
      } catch {
        // ignore geocoder errors
      }
    });
    
    // Marker drag end to update address and lat/lng
    markerRef.current.addListener?.("dragend", async (e: unknown) => {
      const evt = e as { latLng?: { lat: () => number; lng: () => number } };
      if (!evt.latLng) return;
      const lat = evt.latLng.lat();
      const lng = evt.latLng.lng();
      setFormData(prev => ({ ...prev, lat, lng }));
      try {
        const geocode = await geocoderRef.current!.geocode({ location: { lat, lng } });
        const address = geocode.results?.[0]?.formatted_address;
        if (address) {
          setFormData(prev => ({ ...prev, location: address }));
          if (autocompleteInputRef.current) {
            autocompleteInputRef.current.value = address;
          }
        }
      } catch {
        // ignore geocoder errors
      }
    });
    
    // Autocomplete
    if (autocompleteInputRef.current) {
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
          mapRef.current?.panTo({ lat, lng });
          mapRef.current?.setZoom(14);
          if (markerRef.current?.setPosition) markerRef.current.setPosition({ lat, lng });
          setFormData(prev => ({ ...prev, location: address, lat, lng }));
        } else {
          setFormData(prev => ({ ...prev, location: address }));
        }
      });
    }
  }, [mapsReady, formData.lat, formData.lng]);
  
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
        if (!formData.propertyCategory) {
          newErrors.propertyCategory = true;
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
             if (!formData.floorsAllowed) newErrors.floorsAllowed = true;
             if (!formData.boundaryWall) newErrors.boundaryWall = true;
             if (!formData.openSides) newErrors.openSides = true;
             if (!formData.anyConstruction) newErrors.anyConstruction = true;
             if (!formData.possessionBy) newErrors.possessionBy = true;
        } else {
           if (formData.propertyType === "residential" && !formData.bedrooms) newErrors.bedrooms = true;
           if (!formData.bathrooms) newErrors.bathrooms = true;
           if (!formData.furnishingStatus) newErrors.furnishingStatus = true;
           if (!formData.totalFloors) newErrors.totalFloors = true;
           if (!formData.floorNumber) newErrors.floorNumber = true;
           if (!formData.area) newErrors.area = true;
           
           if (!formData.availabilityStatus) {
             newErrors.availabilityStatus = true;
           } else if (formData.availabilityStatus === "Ready to move") {
             if (!formData.ageOfProperty) newErrors.ageOfProperty = true;
           } else if (formData.availabilityStatus === "Under construction") {
             if (!formData.possessionBy) newErrors.possessionBy = true;
           }
        }
        
        if (Object.keys(newErrors).length > 0) isValid = false;
        break;
      case 4:
        return true;
      case 5:
        if (formData.uniqueDescription && formData.uniqueDescription.length < 30) {
          newErrors.uniqueDescription = true;
          isValid = false;
        }
        
        if (!formData.ownership) {
          newErrors.ownership = true;
          isValid = false;
        }
        
        if (!formData.price) {
          newErrors.price = true;
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
    if (activeStep < 5) {
      if (!validateStep(activeStep)) {
        return;
      }
      
      const nextStep = activeStep + 1;
      setInternalStep(nextStep);
      if (onStepChange) onStepChange(nextStep);
      
      if (onScoreChange) onScoreChange(Math.min(100, nextStep * 20));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (activeStep > 1) {
      const prevStep = activeStep - 1;
      setInternalStep(prevStep);
      if (onStepChange) onStepChange(prevStep);
      window.scrollTo(0, 0);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Property Type Section (Moved to Top) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Property Type</h3>
        <div className="flex flex-wrap gap-4 mb-6">
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
              className={`px-8 py-3 rounded-lg text-base font-medium transition-all min-w-[140px] ${
                formData.propertyType === option.value
                  ? "bg-blue-50 text-[#0066FF] border border-blue-50" 
                  : "bg-white border border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Property Category Grid (Image 1 Style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                        { label: "Plot", value: "Plot / Land", icon: LandPlot },
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
                  onClick={() => setFormData({...formData, propertyCategory: opt.value})}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all h-32 hover:shadow-md ${
                    formData.propertyCategory === opt.value
                      ? "bg-blue-50 border-[#0066FF] text-[#0066FF] shadow-sm" 
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${formData.propertyCategory === opt.value ? "text-[#0066FF]" : "text-gray-400"}`} />
                  <span className="text-sm font-medium text-center leading-tight">{opt.label}</span>
                </button>
            )});
          })()}
        </div>
      </div>

      {/* Looking To Section (Moved to Bottom) */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-3">Looking to</h3>
        <div className="flex flex-wrap gap-4">
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
              className={`px-8 py-3 rounded-lg text-base font-medium transition-all min-w-[120px] ${
                lookingTo === option.value
                  ? "bg-blue-50 text-[#0066FF] border border-blue-50" 
                  : "bg-white border border-gray-200 text-gray-900 hover:border-gray-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn">
      <h3 className="text-lg font-bold text-[#000929] mb-4">Location Details</h3>
      <div>
        <label className="block text-sm mb-1 text-gray-600 font-medium">City / Location</label>
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
            <input
              type="text"
              required
              className={`w-full p-3 rounded-lg bg-white border focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 ${errors.location ? "border-red-500" : "border-gray-300"}`}
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. Mumbai, India"
            />
          )}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loadingLocation}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#0085FF] transition-colors rounded-full hover:bg-blue-50"
            title="Use current location"
          >
            {loadingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div ref={mapContainerRef} className="w-full h-96"></div>
          <div className="p-3 bg-gray-50 text-xs text-gray-500 text-center">
            Drag the marker to pinpoint the exact location
          </div>
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
               <h3 className="text-lg font-bold text-[#000929]">Add Area Details</h3>
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
             <h3 className="text-lg font-bold text-[#000929] mb-4">Property Dimensions <span className="text-sm font-normal text-gray-400 italic">(Optional)</span></h3>
             <div className="space-y-4">
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                  value={formData.plotLength}
                  onChange={e => setFormData({...formData, plotLength: e.target.value})}
                  placeholder="Length of plot (in Ft.)"
                />
                <input
                  type="number"
                  className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                  value={formData.plotBreadth}
                  onChange={e => setFormData({...formData, plotBreadth: e.target.value})}
                  placeholder="Breadth of plot (in Ft.)"
                />
             </div>
           </div>

           {/* Floors Allowed */}
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
                   className={`px-6 py-2 rounded-full border text-sm font-medium transition-all ${
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
                   className={`w-12 h-12 rounded-full border text-sm font-medium flex items-center justify-center transition-all ${
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
                   className={`px-6 py-2 rounded-full border text-sm font-medium transition-all ${
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
               {["Immediate", "Within 3 Months", "Within 6 Months", "Select Year +"].map(opt => (
                 <button
                   key={opt}
                   type="button"
                   onClick={() => setFormData({...formData, possessionBy: opt})}
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
           </div>
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
                    onClick={() => setFormData({...formData, bedrooms: num === "5+" ? "5" : num})}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.bedrooms === (num === "5+" ? "5" : num)
                        ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                        : `bg-white ${errors.bedrooms ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-600 font-medium">Balconies</label>
              <div className="flex gap-2">
                {["0", "1", "2", "3+"].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({...formData, balconies: num})}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      formData.balconies === num
                        ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            </>
          )}
         
         <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">{formData.propertyType === "commercial" ? "Washrooms" : "Bathrooms"}</label>
             <div className="flex gap-2">
               {["1", "2", "3", "4+"].map(num => (
                 <button
                   key={num}
                   type="button"
                   onClick={() => setFormData({...formData, bathrooms: num === "4+" ? "4" : num})}
                   className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                     formData.bathrooms === (num === "4+" ? "4" : num)
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : `bg-white ${errors.bathrooms ? "border-red-500 text-red-500" : "border-gray-200 text-gray-500"} hover:border-gray-300`
                   }`}
                 >
                   {num}
                 </button>
               ))}
             </div>
         </div>
        </div>

        <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Furnishing Status</label>
             <div className="flex gap-3">
               {["Fully Furnished", "Semi-Furnished", "Unfurnished"].map(status => (
                 <button
                   key={status}
                   type="button"
                   onClick={() => setFormData({...formData, furnishingStatus: status === "Fully Furnished" ? "furnished" : status === "Semi-Furnished" ? "semi-furnished" : "unfurnished"})}
                   className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                     formData.furnishingStatus === (status === "Fully Furnished" ? "furnished" : status === "Semi-Furnished" ? "semi-furnished" : "unfurnished")
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                   }`}
                 >
                   <Sofa className="w-4 h-4" />
                   {status}
                 </button>
               ))}
             </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Carpet Area</label>
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
                 <option value="sqm">Sq.m</option>
                 <option value="acres">Acres</option>
                 <option value="marla">Marla</option>
                 <option value="cents">Cents</option>
               </select>
             </div>
           </div>
           
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Built-up Area</label>
             <div className="flex gap-2">
               <input
                 type="text"
                 className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                 value={formData.builtUpArea}
                 onChange={e => setFormData({...formData, builtUpArea: e.target.value})}
                 placeholder="Size"
               />
               <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
                 {formData.units}
               </div>
             </div>
           </div>

           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Super Built-up Area</label>
             <div className="flex gap-2">
               <input
                 type="text"
                 className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                 value={formData.superBuiltUpArea}
                 onChange={e => setFormData({...formData, superBuiltUpArea: e.target.value})}
                 placeholder="Size"
               />
               <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm">
                 {formData.units}
               </div>
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
              <label className="block text-sm mb-2 text-gray-600 font-medium">Reserved Parking</label>
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
                     {Array.from({length: parseInt(formData.totalFloors || "50")}, (_, i) => i + 1).map(num => (
                       <option key={num} value={num}>{num}</option>
                     ))}
                   </select>
                 </div>
               </div>
            </div>
        </div>

        <div className="mb-6">
             <label className="block text-sm mb-2 text-gray-600 font-medium">Availability Status</label>
             <div className="flex gap-3 mb-4">
               {["Ready to move", "Under construction"].map(status => (
                 <button
                   key={status}
                   type="button"
                   onClick={() => setFormData({...formData, availabilityStatus: status})}
                   className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                     formData.availabilityStatus === status
                       ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                       : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                   }`}
                 >
                   {status}
                 </button>
               ))}
             </div>
             
             {formData.availabilityStatus === "Ready to move" && (
               <div>
                 <label className="block text-sm mb-2 text-gray-600 font-medium">Age of Property</label>
                 <div className="flex flex-wrap gap-3">
                   {["0-1 Years", "1-5 Years", "5-10 Years", "10+ Years"].map(age => (
                     <button
                       key={age}
                       type="button"
                       onClick={() => setFormData({...formData, ageOfProperty: age})}
                       className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                         formData.ageOfProperty === age
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
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
                 <label className="block text-sm mb-2 text-gray-600 font-medium">Possession By</label>
                 <div className="flex flex-wrap gap-3">
                   {["Dec 2024", "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "Select Year +"].map(date => (
                     <button
                       key={date}
                       type="button"
                       onClick={() => setFormData({...formData, possessionBy: date})}
                       className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                         formData.possessionBy === date
                           ? "bg-[#E6F2FF] border-[#0085FF] text-[#0085FF]"
                           : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                       }`}
                     >
                       {date}
                     </button>
                   ))}
                 </div>
               </div>
             )}
        </div>
        </>
      )}



      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">Description</label>
        <textarea
          className="w-full p-4 rounded-xl bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 h-32 resize-none"
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
         <h3 className="text-lg font-bold text-[#000929]">Photos</h3>
         <span className="text-sm text-gray-500">Add photos</span>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
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
               className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
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
               className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
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
               className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
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
                 className="w-full p-2.5 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
      {/* Unique Description */}
      <div>
        <label className="block text-lg font-bold text-[#000929] mb-4">What makes your property unique</label>
        <p className="text-sm text-gray-500 mb-2">Share the unique features of your property to attract buyers.</p>
        <textarea
          className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 min-h-[150px]"
          placeholder="Describe your property..."
          value={formData.uniqueDescription}
          onChange={e => {
            if (e.target.value.length <= 5000) {
              setFormData({...formData, uniqueDescription: e.target.value});
            }
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min 30 characters</span>
          <span>{formData.uniqueDescription?.length || 0}/5000</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-[#000929] mb-4">Pricing Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Expected Price</label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
               <input
                 type="number"
                 required
                 className="w-full pl-8 p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                 value={formData.price}
                 onChange={e => setFormData({...formData, price: e.target.value})}
                 placeholder="Enter amount"
               />
             </div>
           </div>
           <div>
             <label className="block text-sm mb-2 text-gray-600 font-medium">Price per sq.ft.</label>
             <div className="relative">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
               <input
                 type="number"
                 className="w-full pl-8 p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                 value={formData.pricePerSqFt}
                 onChange={e => setFormData({...formData, pricePerSqFt: e.target.value})}
                 placeholder="Enter amount"
               />
             </div>
           </div>
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
      </div>
      
      <div>
         <label className="block text-sm mb-2 text-gray-600 font-medium">Property Title (Auto-generated or Custom)</label>
         <input
           type="text"
           required
           className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
           value={formData.title}
           onChange={e => setFormData({...formData, title: e.target.value})}
           placeholder="e.g. 3 BHK Luxury Apartment in Bandra West"
         />
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-lg font-bold text-[#000929] mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-gray-600 font-medium">Name</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.OwnerName}
              onChange={e => setFormData({...formData, OwnerName: e.target.value})}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-600 font-medium">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="Your contact number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-2 text-gray-600 font-medium">Email Address</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="Your email address"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Add to Firestore with standardized fields only
      const payload = {
        title: formData.title,
        location: formData.location,
        lat: formData.lat ?? null,
        lng: formData.lng ?? null,
        price: Number(formData.price),
        priceUnit: formData.priceUnit,
        ownership: formData.ownership,
        pricePerSqFt: formData.pricePerSqFt ? Number(formData.pricePerSqFt) : null,
        allInclusivePrice: formData.allInclusivePrice,
        taxExcluded: formData.taxExcluded,
        priceNegotiable: formData.priceNegotiable,
        uniqueDescription: formData.uniqueDescription,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
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
        balconies: formData.balconies,
        builtUpArea: formData.builtUpArea,
        superBuiltUpArea: formData.superBuiltUpArea,
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
        images: validUrls,
        videoUrl: finalVideoUrl || null,
        floorPlan: finalFloorPlanUrl || null,
        sellerId,
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
          bathrooms: "",
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
          propertyCategory: "Flat/Apartment"
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
      </div>

      <div className="mt-8 flex items-center gap-4 pt-6 border-t border-gray-100">
        {activeStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}
        
        {activeStep < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="ml-auto px-8 py-2.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-medium transition-colors shadow-sm shadow-blue-200"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="ml-auto px-8 py-2.5 rounded-lg bg-[#0066FF] hover:bg-blue-700 text-white font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-200"
          >
            {loading ? (propertyId ? "Updating..." : "Posting...") : (propertyId ? "Update Property" : "Post Property")}
          </button>
        )}
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
