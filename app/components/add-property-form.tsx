"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MapPin, Loader2 } from "lucide-react";
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

export default function AddPropertyForm({ defaultType = "sell", onSuccess, initialData, propertyId }: { defaultType?: "rent" | "sell", onSuccess?: () => void, initialData?: any, propertyId?: string }) {
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
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
    propertyCategory: "Flat/Apartment"
  });
  
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
        propertyCategory: initialData.propertyCategory || "Flat/Apartment"
      });
      if (initialData.images) {
        setExistingImages(initialData.images);
      }
      if (initialData.videoUrl) {
        setExistingVideo(initialData.videoUrl);
      }
    }
  }, [initialData, defaultType]);

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [loadingLocation, setLoadingLocation] = useState(false);
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
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images, existingImages]);
  
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
      // Ensure unique, non-empty URLs
      const allImages = [...existingImages, ...imageUrls.filter((u): u is string => !!u)];
      // Upload video if selected
      let finalVideoUrl = existingVideo;
      if (video) {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${video.name}`;
        const storageRef = ref(storage, `property_video/${unique}`);
        try {
          const snapshot = await uploadBytes(storageRef, video);
          finalVideoUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          try {
            await signInAnonymously(auth);
            const snapshot2 = await uploadBytes(storageRef, video);
            finalVideoUrl = await getDownloadURL(snapshot2.ref);
          } catch {
            finalVideoUrl = existingVideo ?? null;
          }
        }
      }
      const validUrls = Array.from(new Set(allImages));

      // Allow property creation even if no images uploaded (use placeholder)
      if (validUrls.length === 0) {
        validUrls.push("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80");
      }

      // Add to Firestore with standardized fields only
      const payload: any = {
        title: formData.title,
        location: formData.location,
        lat: formData.lat ?? null,
        lng: formData.lng ?? null,
        price: Number(formData.price),
        priceUnit: formData.priceUnit,
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
        images: validUrls,
        videoUrl: finalVideoUrl || null,
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
      }

    } catch (error) {
      console.error("Error listing property:", error);
      alert("Error listing property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-gray-900">
      <h3 className="text-xl font-bold mb-4 text-[#000929]">{propertyId ? "Edit Property" : "List Your Property"}</h3>
      
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-600 font-medium">I want to</label>
        <select
          className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
          value={formData.type}
          onChange={e => setFormData({...formData, type: e.target.value as "rent" | "sell"})}
        >
          <option value="sell">Sell Property</option>
          <option value="rent">Rent Out Property</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-3 text-gray-600 font-medium">Property Type</label>
        
        <div className="flex gap-6 mb-4">
          <label className="flex items-center cursor-pointer">
            <input 
              type="radio" 
              name="propertyType" 
              value="residential" 
              checked={formData.propertyType === "residential"} 
              onChange={() => setFormData({...formData, propertyType: "residential", propertyCategory: "Flat/Apartment"})}
              className="mr-2 w-5 h-5 accent-[#0085FF]" 
            />
            <span className="text-gray-900">Residential</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input 
              type="radio" 
              name="propertyType" 
              value="commercial" 
              checked={formData.propertyType === "commercial"} 
              onChange={() => setFormData({...formData, propertyType: "commercial", propertyCategory: "Office Space"})}
              className="mr-2 w-5 h-5 accent-[#0085FF]" 
            />
            <span className="text-gray-900">Commercial</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(formData.propertyType === "residential" ? [
            "Flat/Apartment", "Independent House / Villa", "Independent / Builder Floor", 
            "Plot / Land", "1 RK/ Studio Apartment", "Serviced Apartment", "Farmhouse", "Other"
          ] : [
             "Office Space", "Shop / Showroom", "Commercial Land", 
             "Warehouse / Godown", "Other"
          ]).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData({...formData, propertyCategory: type})}
              className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                formData.propertyCategory === type 
                  ? "bg-blue-50 border-[#0085FF] text-[#0085FF] font-medium" 
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      
      {/* Rent frequency removed as per new standardization */}

      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-600 font-medium">Property Title</label>
        <input
          type="text"
          required
          className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          placeholder="e.g. Luxury Villa"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-gray-600 font-medium">Location</label>
          <div className="relative">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <input
                ref={autocompleteInputRef}
                type="text"
                required
                className="w-full p-2 pr-10 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                defaultValue={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Search location"
              />
            ) : (
              <input
                type="text"
                required
                className="w-full p-2 pr-10 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="e.g. Mumbai, India"
              />
            )}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={loadingLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#0085FF] transition-colors rounded-full hover:bg-blue-50"
              title="Use current location"
            >
              {loadingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-600 font-medium">Price</label>
          <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-2">
            <input
              type="number"
              required
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
              placeholder="Amount"
            />
            <select
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
              value={formData.priceUnit}
              onChange={e => setFormData({...formData, priceUnit: e.target.value})}
            >
              <option value="per_month">Per Month</option>
              <option value="per_year">Per Year</option>
              <option value="per_sqft">Per Sq Ft</option>
              <option value="per_sqm">Per Sq Meter (sqm)</option>
              <option value="per_acre">Per Acre</option>
              <option value="per_bigha">Per Bigha</option>
              <option value="per_katha">Per Katha</option>
              <option value="per_gaj">Per Gaj</option>
            </select>
          </div>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="col-span-1 md:col-span-2">
            <div ref={mapContainerRef} className="mt-3 w-full h-80 rounded-lg overflow-hidden border border-gray-300"></div>
          </div>
        )}
      </div>

      <div className={`grid ${(formData.propertyCategory.includes("Land") || formData.propertyCategory.includes("Plot")) ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-3"} gap-4 mb-4`}>
        {formData.propertyType === "residential" && !formData.propertyCategory.includes("Land") && !formData.propertyCategory.includes("Plot") && (
          <div>
            <label className="block text-sm mb-1 text-gray-600 font-medium">Bedrooms</label>
            <input
              type="number"
              required
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.bedrooms}
              onChange={e => setFormData({...formData, bedrooms: e.target.value})}
              placeholder="Count"
            />
          </div>
        )}
        {!formData.propertyCategory.includes("Land") && !formData.propertyCategory.includes("Plot") && (
          <div>
            <label className="block text-sm mb-1 text-gray-600 font-medium">{formData.propertyType === "commercial" ? "Washrooms" : "Bathrooms"}</label>
            <input
              type="number"
              required
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.bathrooms}
              onChange={e => setFormData({...formData, bathrooms: e.target.value})}
              placeholder="Count"
            />
          </div>
        )}
        <div>
          <label className="block text-sm mb-1 text-gray-600 font-medium">Area</label>
          <div className="grid grid-cols-1 sm:grid-cols-[2fr,1fr] gap-2">
            <input
              type="text"
              required
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
              value={formData.area}
              onChange={e => setFormData({...formData, area: e.target.value})}
              placeholder="Size"
            />
            <select
              className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent text-gray-900"
              value={formData.units}
              onChange={e => setFormData({...formData, units: e.target.value})}
            >
              <option value="sqft">Sq.ft.</option>
              <option value="sqyards">Sq.yards</option>
              <option value="sqm">Sq.m.</option>
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
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-2 text-gray-600 font-medium">Features</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {(formData.propertyType === "residential" ? [
            "Parking", "Swimming Pool", "Gym", "Garden", 
            "Balcony", "Elevator", "Security", "Power Backup", 
            "Water Supply", "Internet", "AC", "Furnished"
          ] : [
            "Parking", "Elevator", "Security", "Power Backup", 
            "Water Supply", "Internet", "Central AC", "Furnished", 
            "CCTV", "Fire Safety", "Cafeteria", "Reception"
          ]).map(feature => (
            <label key={feature} className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
              <input
                type="checkbox"
                className="mr-2 rounded accent-[#0085FF]"
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
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Selected Features:</p>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span key={index} className="bg-[#0085FF] hover:bg-[#006ACC] text-white px-3 py-1 rounded-full text-sm flex items-center transition-colors">
                  {feature}
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, features: formData.features.filter((_, i) => i !== index)})}
                    className="ml-2 text-white hover:text-red-200 font-bold transition-colors"
                    title="Remove feature"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-600 font-medium">Description</label>
        <textarea
          className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900 h-24 resize-none"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Describe your property..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 text-gray-600 font-medium">Owner Name</label>
          <input
            type="text"
            required
            className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
            value={formData.OwnerName}
            onChange={e => setFormData({...formData, OwnerName: e.target.value})}
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-600 font-medium">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-600 font-medium">Contact Phone</label>
        <input
          type="tel"
          required
          className="w-full p-2 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0085FF] focus:border-transparent placeholder-gray-400 text-gray-900"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
          placeholder="+91-XXXXXXXXXX"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-1 text-gray-600 font-medium">Property Video (Optional)</label>
        <input
          id="property-video-input"
          type="file"
          accept="video/*"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              setVideo(e.target.files[0]);
            }
          }}
          className="hidden"
        />
        <div className="flex items-center justify-between">
          <label
            htmlFor="property-video-input"
            className="inline-block cursor-pointer bg-[#0085FF] hover:bg-[#006ACC] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Choose video
          </label>
          {(video || existingVideo) && (
            <div className="flex items-center gap-3">
              {video && <span className="text-sm text-gray-600 truncate max-w-[200px]">{video.name}</span>}
              {!video && existingVideo && <span className="text-sm text-gray-600 truncate max-w-[200px]">Existing video</span>}
              <button
                type="button"
                onClick={() => { setVideo(null); setExistingVideo(null); }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md border border-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {(video || existingVideo) && (
          <div className="mt-3">
            {existingVideo && !video && (
              <div className="relative w-full max-w-xs aspect-video bg-black rounded-md overflow-hidden">
                <video src={existingVideo} controls className="w-full h-full object-contain" />
              </div>
            )}
            {video && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-900 font-medium truncate">{video.name}</p>
                <p className="text-xs text-gray-500">{(video.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-1 text-gray-600 font-medium">Property Images</label>
        <input
          id="property-images-input"
          type="file"
          multiple
          accept="image/*"
          onChange={e => {
            if (e.target.files) {
              handleFilesAdd(Array.from(e.target.files));
            }
          }}
          className="hidden"
        />
        <div className="flex items-center justify-between">
          <label
            htmlFor="property-images-input"
            className="inline-block cursor-pointer bg-[#0085FF] hover:bg-[#006ACC] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Choose files
          </label>
          {images.length + existingImages.length > 0 && (
            <span className="text-sm text-gray-500 ml-3">{images.length + existingImages.length} selected</span>
          )}
        </div>
        {(images.length > 0 || existingImages.length > 0) && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{images.length + existingImages.length} images selected</span>
              <button
                type="button"
                onClick={() => { setImages([]); setExistingImages([]); }}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-md border border-gray-300"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                  <Image src={url} alt={`preview-${idx + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute top-1 right-1 z-10 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Tip: Select multiple images at once or drag & drop</p>
          </div>
        )}
        <div
          onDragOver={e => {
            e.preventDefault();
          }}
          onDrop={e => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
            if (files.length) handleFilesAdd(files);
          }}
          className="mt-3 border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors text-center"
        >
          Drag & drop images here
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#0085FF] hover:bg-[#006ACC] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (propertyId ? "Updating Property..." : "Listing Property...") : (propertyId ? "Update Property" : "List Property Now")}
      </button>
      {loading && images.length > 0 && (
        <p className="mt-2 text-center text-gray-600 text-sm">Uploading images… {uploadProgress}%</p>
      )}
    </form>
  );
}
