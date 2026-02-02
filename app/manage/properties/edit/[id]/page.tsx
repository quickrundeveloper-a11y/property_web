"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AddPropertyForm from "@/app/components/add-property-form";
import { Stepper, PropertyScoreCard, steps } from "@/app/components/stepper";
import { ArrowLeft } from "lucide-react";

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyScore, setPropertyScore] = useState(80);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      try {
        const docRef = doc(db, "property_All", "main", "properties", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProperty(docSnap.data());
        } else {
          alert("Property not found");
          router.push("/manage/dashboard");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!property) return null;

  return (
    <div className="min-h-screen bg-[#F0F5FA] pb-12">
      <div className="bg-white border-b sticky top-0 z-10 mb-8">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Edit Property</h1>
          </div>
          
          {/* Mobile Progress Bar */}
          <div className="md:hidden mt-3 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-[#0085FF] h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${(currentStep / 5) * 100}%` }} 
              ></div>
            </div>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Step {currentStep}/5</span>
          </div>
        </div>
      </div>

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
                  maxStep={5}
                />
                <PropertyScoreCard score={propertyScore} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-3/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <AddPropertyForm 
                defaultType={property.type} 
                initialData={property} 
                propertyId={id}
                onSuccess={() => router.push("/manage/dashboard")}
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
