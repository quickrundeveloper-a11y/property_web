"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import AddPropertyForm from "../components/add-property-form";

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.isAnonymous)) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated, return null to prevent flash (though useEffect handles redirect)
  if (!user || user.isAnonymous) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F0F5FA] py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#000929]">Add Property</h1>
          <button
            onClick={() => router.push("/home")}
            className="bg-white hover:bg-gray-50 text-[#005DB2] border border-[#005DB2] px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            Back to Home
          </button>
        </div>
        <div className="bg-white rounded-xl p-6 md:p-8 shadow-xl border border-gray-100">
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
