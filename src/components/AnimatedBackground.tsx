
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const AnimatedBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div 
        className="absolute top-0 left-0 w-full h-full opacity-20"
        style={{
          background: "radial-gradient(circle 800px at var(--x) var(--y), rgba(255, 182, 193, 0.15), transparent 80%)"
        }}
        animate={{
          "--x": `${mousePosition.x}px`,
          "--y": `${mousePosition.y}px`
        } as any}
        transition={{ type: "spring", damping: 10, stiffness: 50 }}
      />
      
      {/* Pink blob in top right */}
      <motion.div 
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-pink-100 opacity-20 blur-3xl"
        animate={{
          x: [0, 20, 0],
          y: [0, 30, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 20,
          ease: "easeInOut"
        }}
      />
      
      {/* Purple blob in bottom left */}
      <motion.div 
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-100 opacity-20 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 25,
          ease: "easeInOut",
          repeatType: "reverse"
        }}
      />
      
      {/* Small particles floating */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-pink-300 opacity-40"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            repeat: Infinity,
            duration: 5 + Math.random() * 10,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
