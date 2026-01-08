"use client";

import { useEffect, useState } from "react";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAnonymously } from "firebase/auth";

export default function AddPropertyForm({ defaultType = "sell", onSuccess }: { defaultType?: "rent" | "sell", onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    units: "sqft",
    features: [] as string[],
    description: "",
    contactName: "",
    phone: "",
    email: "",
    type: defaultType,
    propertyCategory: "apartment"
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);
  
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
        await signInAnonymously(auth);
        console.log("User authenticated successfully");
      } catch (authError) {
        console.log("Authentication not required or already authenticated");
      }

      const uploadWithTimeout = async (file: File, ms = 30000) => {
        const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const storageRef = ref(storage, `properties/${unique}`);
        
        const uploadPromise = (async () => {
          try {
            console.log("Attempting to upload file:", file.name);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            console.log("Upload successful:", url);
            return url;
          } catch (error) {
            console.error("Upload failed:", error);
            // Try with explicit authentication
            try {
              console.log("Retrying with authentication...");
              await signInAnonymously(auth);
              const snapshot2 = await uploadBytes(storageRef, file);
              const url2 = await getDownloadURL(snapshot2.ref);
              console.log("Retry upload successful:", url2);
              return url2;
            } catch (retryError) {
              console.error("Retry upload also failed:", retryError);
              return null;
            }
          }
        })();
        
        const timeoutPromise = new Promise<string | null>((resolve) => {
          setTimeout(() => {
            console.log("Upload timeout reached");
            resolve(null);
          }, ms);
        });
        
        return Promise.race([uploadPromise, timeoutPromise]);
      };

      const settled = await Promise.allSettled(
        images.map(async (image) => {
          try {
            const url = await uploadWithTimeout(image);
            return url;
          } catch (error) {
            console.error("Error uploading image:", error);
            return null;
          }
        })
      );
      
      const imageUrls = settled.map((res) => (res.status === "fulfilled" ? res.value : null));
      const validUrls = imageUrls.filter((u): u is string => !!u);

      console.log(`Successfully uploaded ${validUrls.length} out of ${images.length} images`);

      // Allow property creation even if no images uploaded (use placeholder)
      if (validUrls.length === 0) {
        console.log("No images uploaded, using placeholder image");
        validUrls.push("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80");
      }

      // Add to Firestore
      await addDoc(collection(db, "properties"), {
        ...formData,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        images: validUrls,
        image: validUrls[0],
        createdAt: serverTimestamp(),
        status: "active"
      });

      alert("Property listed successfully!");
      if (onSuccess) onSuccess();
      
      // Reset form
      setFormData({
        title: "",
        location: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        area: "",
        units: "sqft",
        features: [],
        description: "",
        contactName: "",
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
          </select>
        </div>
      </div>

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
        <div>
          <label className="block text-sm mb-1 text-white/80">Location</label>
          <input
            type="text"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            placeholder="e.g. Mumbai, India"
          />
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
          <label className="block text-sm mb-1 text-white/80">Contact Name</label>
          <input
            type="text"
            required
            className="w-full p-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-white/60"
            value={formData.contactName}
            onChange={e => setFormData({...formData, contactName: e.target.value})}
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
    </form>
  );
}
