import { motion } from "framer-motion";
import { Check, Clock, ChefHat, Bike } from "lucide-react";

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
}

interface OrderProgressTrackerProps {
  currentStep: number;
}

export const OrderProgressTracker = ({ currentStep }: OrderProgressTrackerProps) => {
  const steps: Step[] = [
    {
      id: "placed",
      label: "Order Placed",
      icon: <Check className="h-5 w-5" />,
      status: currentStep >= 1 ? "completed" : "pending"
    },
    {
      id: "preparing",
      label: "Chef Preparing",
      icon: <ChefHat className="h-5 w-5" />,
      status: currentStep === 2 ? "current" : currentStep > 2 ? "completed" : "pending"
    },
    {
      id: "ready",
      label: "Ready",
      icon: <Clock className="h-5 w-5" />,
      status: currentStep === 3 ? "current" : currentStep > 3 ? "completed" : "pending"
    },
    {
      id: "delivery",
      label: "Out for Delivery",
      icon: <Bike className="h-5 w-5" />,
      status: currentStep === 4 ? "current" : currentStep > 4 ? "completed" : "pending"
    }
  ];

  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-muted">
        <motion.div
          className="h-full bg-gradient-hero"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <motion.div
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-gradient-hero text-white shadow-warm"
                    : isCurrent
                    ? "bg-white border-4 border-primary text-primary shadow-soft"
                    : "bg-muted text-muted-foreground"
                }`}
                animate={isCurrent ? {
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{
                  duration: 1.5,
                  repeat: isCurrent ? Infinity : 0,
                }}
              >
                {step.icon}
                
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{
                      scale: [1, 1.3],
                      opacity: [0.7, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.div>
              
              <p className={`mt-3 text-sm font-medium text-center ${
                isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
