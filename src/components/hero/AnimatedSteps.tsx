
import { motion } from "framer-motion";
import { DollarSign, Clock, Trophy } from "lucide-react";

const AnimatedSteps = () => {
  const steps = [
    {
      icon: <DollarSign className="w-5 h-5 text-gray-800" />,
      title: "Step 1",
      description: "Get makeup price shock 😱 (we've all been there)"
    },
    {
      icon: <Clock className="w-5 h-5 text-gray-800" />,
      title: "Step 2",
      description: "Sit pretty while we find your affordable twins 👯‍♀️",
      subtext: "new products need ~1min for our beauty AI to perfect-match"
    },
    {
      icon: <Trophy className="w-5 h-5 text-gray-800" />,
      title: "Finally",
      description: "Keep your look, lose the cost, win at life 🏆"
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
            {step.subtext && <p className="text-sm text-gray-500 mt-1">{step.subtext}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AnimatedSteps;
