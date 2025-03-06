
import { Search, Sparkles, DollarSign, PenTool } from "lucide-react";
import { motion } from "framer-motion";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Search className="h-10 w-10 text-pink-500" />,
      title: "Search Your Product",
      description: "Enter the name of your favorite makeup product or take a photo of it."
    },
    {
      icon: <Sparkles className="h-10 w-10 text-pink-500" />,
      title: "AI Finds Dupes",
      description: "Our advanced AI instantly identifies affordable alternatives that match your product."
    },
    {
      icon: <DollarSign className="h-10 w-10 text-pink-500" />,
      title: "Compare & Save",
      description: "See ingredient matches, price comparisons, and how much you'll save with each dupe."
    },
    {
      icon: <PenTool className="h-10 w-10 text-pink-500" />,
      title: "Make Beauty Affordable",
      description: "Get the same look without the premium price tag. Beauty should be accessible to everyone."
    }
  ];

  // Animation variants for container
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  // Animation variants for items
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-pink-50/30">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">
            How Dupe Academy Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto font-light">
            Finding affordable alternatives to your favorite makeup products has never been easier. 
            Just follow these simple steps.
          </p>
        </motion.div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={item}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="mb-4 flex justify-center">
                <div className="p-3 bg-pink-50 rounded-full group-hover:bg-pink-100 transition-colors">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              <div className="mt-4 flex justify-center">
                <div className="h-1 w-16 bg-pink-200 rounded-full"></div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-pink-500 font-medium">
            Join thousands of beauty enthusiasts who've already saved up to 70% on their makeup routine.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
