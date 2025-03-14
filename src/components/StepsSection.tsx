
import { motion } from "framer-motion";
import { ScrollText, Search, Sparkles } from "lucide-react";

const StepsSection = () => {
  const steps = [
    {
      icon: <Search className="h-6 w-6 text-gray-800" />,
      title: "Find Your Product",
      description: "Search for your favorite high-end beauty product or take a photo."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-gray-800" />,
      title: "Discover Dupes",
      description: "Our AI analyzes ingredients and finds affordable alternatives that match."
    },
    {
      icon: <ScrollText className="h-6 w-6 text-gray-800" />,
      title: "Compare & Save",
      description: "See side-by-side comparisons and save up to 70% without sacrificing quality."
    }
  ];

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-medium text-gray-800 text-center mb-12"
        >
          How It Works
        </motion.h2>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6 p-4 bg-white rounded-full shadow-md">
                {step.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-3">{step.title}</h3>
              <p className="text-gray-700">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StepsSection;
