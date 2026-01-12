"use client";

import { useRouter } from "next/navigation";
import AddPropertyForm from "../components/add-property-form";

export default function AddPropertyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 text-white py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Add Property</h1>
          <button
            onClick={() => router.push("/home")}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </button>
        </div>
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
