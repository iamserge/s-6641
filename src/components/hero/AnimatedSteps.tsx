
import { motion } from "framer-motion";
import { Search, Sparkles, ScrollText } from "lucide-react";

const AnimatedSteps = () => {
  const steps = [
    {
      icon: <Search className="w-5 h-5 text-gray-800" />,
      title: "Find Your Product",
      description: "Search for your favorite high-end beauty product or take a photo."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-gray-800" />,
      title: "Discover Dupes",
      description: "Our AI analyzes ingredients and finds affordable alternatives that match."
    },
    {
      icon: <ScrollText className="w-5 h-5 text-gray-800" />,
      title: "Compare & Save",
      description: "See side-by-side comparisons and save up to 70% without sacrificing quality."
    }
  ];

  const stepAnimation = {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        delay: 1.9 + (i * 0.2),
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    })
  };

  return (
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <motion.div 
            key={index}
            className="flex flex-col items-center text-center"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={stepAnimation}
          >
            <div className="mb-4 p-4 bg-white rounded-full shadow-md">
              {step.icon}
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">{step.title}</h3>
            <p className="text-gray-700">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedSteps;
