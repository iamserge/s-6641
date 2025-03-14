
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    id: 1,
    content: "I saved over $200 on my skincare routine thanks to Dupe Academy's recommendations. The ingredient matching technology is incredible!",
    author: "Sofia Rodriguez",
    role: "Beauty Enthusiast",
    avatar: "/placeholders/1.png"
  },
  {
    id: 2,
    content: "As a college student on a budget, finding affordable alternatives to my favorite products has been a game-changer. Can't recommend this site enough!",
    author: "James Wilson",
    role: "Student",
    avatar: "/placeholders/2.png"
  },
  {
    id: 3,
    content: "The detailed ingredient analysis helped me find products that work just as well as the expensive ones I was using. My skin has never looked better!",
    author: "Michelle Zhang",
    role: "Skincare Blogger",
    avatar: "/placeholders/3.png"
  }
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-violet-50 to-pink-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of beauty enthusiasts who have transformed their routines without breaking the bank.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <button 
              onClick={prevTestimonial}
              className="p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-pink-100 text-violet-700 hover:bg-violet-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          
          <div className="overflow-hidden relative py-12">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-pink-100 p-8 md:p-12"
            >
              <div className="flex justify-center mb-8">
                <div className="bg-violet-100 p-3 rounded-full">
                  <Quote className="w-6 h-6 text-violet-600" />
                </div>
              </div>
              
              <p className="text-lg md:text-xl text-center text-gray-700 mb-8">
                "{testimonials[activeIndex].content}"
              </p>
              
              <div className="flex flex-col items-center">
                <Avatar className="w-16 h-16 border-4 border-pink-100 mb-4">
                  <AvatarImage src={testimonials[activeIndex].avatar} alt={testimonials[activeIndex].author} />
                  <AvatarFallback>{testimonials[activeIndex].author.charAt(0)}</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold text-lg text-violet-800">
                  {testimonials[activeIndex].author}
                </h4>
                <p className="text-gray-500">{testimonials[activeIndex].role}</p>
              </div>
            </motion.div>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <button 
              onClick={nextTestimonial}
              className="p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-pink-100 text-violet-700 hover:bg-violet-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === activeIndex ? "bg-violet-600" : "bg-violet-200"
                } transition-colors`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
