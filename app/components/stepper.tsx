
import { Check } from "lucide-react";

export const steps = [
  { id: 1, label: "Basic Details" },
  { id: 2, label: "Location Details" },
  { id: 3, label: "Property Profile" },
  { id: 4, label: "Photos & Videos" },
  { id: 5, label: "Amenities & Details" },
];

export function Stepper({ steps, currentStep, onStepClick, maxStep }: { steps: { id: number; label: string }[]; currentStep: number; onStepClick: (step: number) => void; maxStep?: number }) {
  const accessibleStepLimit = maxStep ?? currentStep;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gray-200"></div>
        
        <div className="space-y-6 relative">
          {steps.map((step) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isAccessible = step.id <= accessibleStepLimit;
            
            return (
              <div 
                key={step.id} 
                className={`flex items-start gap-4 ${isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                onClick={() => isAccessible && onStepClick(step.id)}
              >
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
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${isCurrent ? "text-[#0066FF]" : "text-gray-600"}`}>
                      {step.label}
                    </p>
                    {(!isCurrent && isAccessible) && (
                      <span className="text-xs text-[#0066FF] font-medium hover:underline">Edit</span>
                    )}
                  </div>
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

export function PropertyScoreCard({ score }: { score: number }) {
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
