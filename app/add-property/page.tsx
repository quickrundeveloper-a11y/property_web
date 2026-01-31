"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import AddPropertyForm from "../components/add-property-form";
import { Check } from "lucide-react";

const steps = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Location Details" },
  { id: 3, label: "Property Profile" },
  { id: 4, label: "Photos & Videos" },
  { id: 5, label: "Amenities & Details" },
];

function Stepper({ steps, currentStep }: { steps: { id: number; label: string }[]; currentStep: number }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-200"></div>
        
        <div className="space-y-6 relative">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            
            return (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                  isCompleted 
                    ? "bg-[#0066FF] border-[#0066FF]" 
                    : isCurrent 
                      ? "bg-white border-[#0066FF]" 
                      : "bg-white border-gray-300"
                }`}>
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-white" />
                  ) : isCurrent ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
                  ) : null}
                </div>
                <div>
                  <p className={`text-sm font-medium ${isCurrent ? "text-[#0066FF]" : "text-gray-600"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400">Step {step.id}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PropertyScoreCard({ score }: { score: number }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-gray-100">
           {/* Simple circular progress visualization */}
           <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
             <circle
               cx="24"
               cy="24"
               r="20"
               stroke="#0085FF"
               strokeWidth="4"
               fill="transparent"
               strokeDasharray="126"
               strokeDashoffset={126 - (126 * score) / 100}
               strokeLinecap="round"
             />
           </svg>
           <span className="text-xs font-bold text-[#000929]">{score}%</span>
        </div>
        <div>
          <p className="text-sm font-bold text-[#000929]">Property Score</p>
          <p className="text-xs text-gray-500">Better your property score, greater your visibility</p>
        </div>
      </div>
    </div>
  );
}

export default function AddPropertyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyScore, setPropertyScore] = useState(17);

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
                <Stepper steps={steps} currentStep={currentStep} />
                <PropertyScoreCard score={propertyScore} />
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:w-3/4">
             <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#000929] md:hidden">Add Property</h1>
              <button
                onClick={() => router.push("/home")}
                className="bg-white hover:bg-gray-50 text-[#005DB2] border border-[#005DB2] px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ml-auto md:ml-0"
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
                currentStep={currentStep}
                onStepChange={setCurrentStep}
                onScoreChange={setPropertyScore}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
