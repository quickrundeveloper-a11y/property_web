"use client";

import { useEffect, useRef, useState } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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

export default function AddPropertyForm({ defaultType = "sell", onSuccess }: { defaultType?: "rent" | "sell", onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    lat: null as number | null,
    lng: null as number | null,
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    units: "sqft",
    features: [] as string[],
    description: "",
    OwnerName: "",
    phone: "",
    email: "",
    type: defaultType,
    propertyCategory: "apartment"
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<MapsLike | null>(null);
  const markerRef = useRef<MarkerLike | null>(null);
  const geocoderRef = useRef<GeocoderLike | null>(null);
  const [mapsReady, setMapsReady] = useState(false);

  const standardizeImage = (file: File, targetWidth = 1200, targetHeight = 900): Promise<File> => {
    return new Promise((resolve) => {
      // Always standardize to fixed dimensions using canvas
      const img = new Image();
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
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);
  
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
  }, [mapsReady]);
  
  const handleFilesAdd = (files: File[]) => {
    setImages(prev => {
      const existing = new Set(prev.map(f => `${f.name}-${f.size}-${f.lastModified}`));
      const incoming = files.filter(f => !existing.has(`${f.name}-${f.size}-${f.lastModified}`));
      return [...prev, ...incoming];
    });
  };

  const removeImageAt = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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
        console.log("Authentication not required or already authenticated");
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
              async (_error: unknown) => {
                try {
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
      const validUrls = Array.from(new Set(imageUrls.filter((u): u is string => !!u)));

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
        propertyCategory: formData.propertyCategory,
        images: validUrls,
        sellerId,
        status: "active" as const,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "property_All", "main", "properties"), payload);

      alert("Property listed successfully!");
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        title: "",
        location: "",
        lat: null,
        lng: null,
        price: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        units: "sqft",
        features: [],
        description: "",
        OwnerName: "",
        phone: "",
        email: "",
        type: defaultType,
        propertyCategory: "apartment"
      });
      setImages([]);

    } catch (error) {
      console.error("Error listing property:", error);
      alert("Error listing property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-white">
      <h3 className="text-xl font-bold mb-4">List Your Property</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 text-white/80">I want to</label>
          <select
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white [&>option]:text-black"
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as "rent" | "sell"})}
          >
            <option value="sell">Sell Property</option>
            <option value="rent">Rent Out Property</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Property Type</label>
          <select
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white [&>option]:text-black"
            value={formData.propertyCategory}
            onChange={e => setFormData({...formData, propertyCategory: e.target.value})}
          >
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="villa">Villa</option>
            <option value="land">Land</option>
          </select>
        </div>
      </div>
      
      {/* Rent frequency removed as per new standardization */}

      <div className="mb-4">
        <label className="block text-sm mb-1 text-white/80">Property Title</label>
        <input
          type="text"
          required
          className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
          value={formData.title}
          onChange={e => setFormData({...formData, title: e.target.value})}
          placeholder="e.g. Luxury Villa"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="md:col-span-1">
          <label className="block text-sm mb-1 text-white/80">Location</label>
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <input
              ref={autocompleteInputRef}
              type="text"
              required
              className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
              defaultValue={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="Search location"
            />
          ) : (
            <input
              type="text"
              required
              className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. Mumbai, India"
            />
          )}
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Price</label>
          <input
            type="number"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            placeholder="Amount"
          />
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <div className="col-span-1 md:col-span-2">
            <div ref={mapContainerRef} className="mt-3 w-full h-80 rounded-lg overflow-hidden border border-white/30"></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 text-white/80">Bedrooms</label>
          <input
            type="number"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.bedrooms}
            onChange={e => setFormData({...formData, bedrooms: e.target.value})}
            placeholder="Count"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Bathrooms</label>
          <input
            type="number"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.bathrooms}
            onChange={e => setFormData({...formData, bathrooms: e.target.value})}
            placeholder="Count"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Area</label>
          <input
            type="text"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.area}
            onChange={e => setFormData({...formData, area: e.target.value})}
            placeholder="Size"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1 text-white/80">Units</label>
        <select
          className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-white [&>option]:text-black"
          value={formData.units}
          onChange={e => setFormData({...formData, units: e.target.value})}
        >
          <option value="sqft">Square Feet (sqft)</option>
          <option value="sqm">Square Meters (sqm)</option>
          <option value="acres">Acres</option>
          <option value="bigha">Bigha</option>
          <option value="katha">Katha</option>
          <option value="gaj">Gaj</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-2 text-white/80">Features</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            "Parking", "Swimming Pool", "Gym", "Garden", 
            "Balcony", "Elevator", "Security", "Power Backup", 
            "Water Supply", "Internet", "AC", "Furnished"
          ].map(feature => (
            <label key={feature} className="flex items-center text-sm text-white/90 cursor-pointer hover:text-white transition-colors">
              <input
                type="checkbox"
                className="mr-2 rounded accent-blue-500"
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
          className="w-full p-3 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/60 text-white"
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
            <p className="text-xs text-white/70 mb-2">Selected Features:</p>
            <div className="flex flex-wrap gap-2">
              {formData.features.map((feature, index) => (
                <span key={index} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-sm flex items-center transition-colors">
                  {feature}
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, features: formData.features.filter((_, i) => i !== index)})}
                    className="ml-2 text-white hover:text-red-300 font-bold transition-colors"
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
        <label className="block text-sm mb-1 text-white/80">Description</label>
        <textarea
          className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60 h-24 resize-none"
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Describe your property..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm mb-1 text-white/80">Owner Name</label>
          <input
            type="text"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.OwnerName}
            onChange={e => setFormData({...formData, OwnerName: e.target.value})}
            placeholder="Enter full name"
          />
        </div>
        <div>
          <label className="block text-sm mb-1 text-white/80">Email</label>
          <input
            type="email"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="Enter email address"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1 text-white/80">Contact Phone</label>
        <input
          type="tel"
          required
          className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
          value={formData.phone}
          onChange={e => setFormData({...formData, phone: e.target.value})}
          placeholder="+91-XXXXXXXXXX"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-1 text-white/80">Property Images</label>
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
            className="inline-block cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-white/20"
          >
            Choose files
          </label>
          {images.length > 0 && (
            <span className="text-sm text-white/70 ml-3">{images.length} selected</span>
          )}
        </div>
        {images.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">{images.length} images selected</span>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md border border-white/30"
              >
                Clear
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border border-white/30">
                  <img src={url} alt={`preview-${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/60 mt-1">Tip: Ek baar me multiple images select karein ya drag & drop karein</p>
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
          className="mt-3 border border-dashed border-white/30 rounded-lg p-3 text-white/70 bg-white/10"
        >
          Drag & drop images yahan chhodein
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Listing Property..." : "List Property Now"}
      </button>
      {loading && images.length > 0 && (
        <p className="mt-2 text-center text-white/70 text-sm">Uploading images… {uploadProgress}%</p>
      )}
    </form>
  );
}
