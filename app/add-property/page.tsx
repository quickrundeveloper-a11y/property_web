"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import AddPropertyForm from "../components/add-property-form";
import { Stepper, PropertyScoreCard, steps } from "@/app/components/stepper";
import { Check } from "lucide-react";

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [propertyScore, setPropertyScore] = useState(17);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    if (step > maxStep) {
      setMaxStep(step);
    }
  };

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
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="md:w-1/4 hidden md:block">
            <div className="sticky top-24">
              <div className="space-y-6">
                <Stepper 
                  steps={steps} 
                  currentStep={currentStep} 
                  onStepClick={setCurrentStep}
                  maxStep={maxStep}
                />
                <PropertyScoreCard score={propertyScore} />
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="w-full md:w-3/4">
             <div className="flex items-center justify-between mb-6 gap-4">
              <div className="flex flex-col md:hidden flex-1">
                <h1 className="text-xl font-bold text-[#000929]">Add Property</h1>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-[#0085FF] h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${(currentStep / 6) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Step {currentStep}/6</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-[#000929] hidden md:block">Add Property</h1>
              <button
                onClick={() => router.push("/")}
                className="bg-white hover:bg-gray-50 text-[#005DB2] border border-[#005DB2] px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-nowrap"
              >
                Exit
              </button>
            </div>
            
            <div className="bg-white rounded-xl p-4 md:p-8 shadow-xl border border-gray-100">
              <AddPropertyForm
                defaultType="sell"
                onSuccess={() => {
                  router.push("/");
                }}
                currentStep={currentStep}
                onStepChange={handleStepChange}
                onScoreChange={setPropertyScore}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
