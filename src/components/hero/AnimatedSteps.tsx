
import { motion } from "framer-motion";
import { DollarSign, Timer, Gift } from "lucide-react";

const AnimatedSteps = () => {
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
    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div 
          className="flex items-center gap-3"
          custom={0}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <div className="text-xs text-pink-500 font-medium">Step 1</div>
            <p className="text-sm text-gray-700">Get makeup price shock 😱 (we've all been there)</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-3"
          custom={1}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Timer className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <div className="text-xs text-purple-500 font-medium">Step 2</div>
            <p className="text-sm text-gray-700">Sit pretty while we find your affordable twins 👯‍♀️</p>
            <p className="text-xs text-gray-500">new products need ~1min for our beauty AI to perfect-match</p>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex items-center gap-3"
          custom={2}
          initial="hidden"
          animate="visible"
          variants={stepAnimation}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
            <Gift className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <div className="text-xs text-pink-500 font-medium">Finally</div>
            <p className="text-sm text-gray-700">Keep your look, lose the cost, win at life 🏆</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedSteps;
