
import { motion } from "framer-motion";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-white" />

      {/* Slick layered radial gradients */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.7) 0%, transparent 60%)",
          filter: "blur(90px)",
          mixBlendMode: "overlay",
        }}
        animate={{
          scale: [1, 1.05, 1],
          x: [-20, 20, -20],
          y: [-10, 10, -10],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 80% 40%, rgba(255, 105, 180, 0.6) 0%, transparent 50%)",
          filter: "blur(70px)",
          mixBlendMode: "soft-light",
        }}
        animate={{
          scale: [1.05, 1.1, 1.05],
          x: [30, -30, 30],
          y: [20, -20, 20],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Subtle studio spotlight effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 70%, rgba(255, 228, 225, 0.9) 0%, transparent 70%)",
          filter: "blur(100px)",
          mixBlendMode: "screen",
        }}
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 11,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Dynamic glowing orb */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 182, 193, 0.8) 10%, transparent 80%)",
          filter: "blur(50px)",
          top: "10%",
          left: "10%",
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.6, 0.8, 0.5, 0.6],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Faint noise texture for studio vibe */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/noise.png')",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;
