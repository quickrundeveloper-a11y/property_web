"use client";

import { useRouter } from "next/navigation";
import AddPropertyForm from "../components/add-property-form";

export default function AddPropertyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 text-white py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">Add Property</h1>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <AddPropertyForm
            defaultType="sell"
            onSuccess={() => {
              router.push("/home");
            }}
          />
        </div>
      </div>
    </div>
  );
}

