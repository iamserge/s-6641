
import { motion } from "framer-motion";

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-white" />

      {/* Enhanced layered radial gradients with more dynamic movement */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 20% 20%, rgba(255, 182, 193, 0.7) 0%, transparent 60%)",
          filter: "blur(90px)",
          mixBlendMode: "overlay",
        }}
        animate={{
          scale: [1, 1.2, 0.9, 1.1, 1],
          x: [-30, 30, -10, 20, -30],
          y: [-20, 15, 25, -15, -20],
          opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
        }}
        transition={{
          duration: 20,
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
          scale: [1.05, 0.95, 1.15, 1, 1.05],
          x: [30, -50, 10, -30, 30],
          y: [20, -10, -40, 30, 20],
          opacity: [0.5, 0.8, 0.6, 0.7, 0.5],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      {/* Subtle studio spotlight effect with more rotation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 70%, rgba(255, 228, 225, 0.9) 0%, transparent 70%)",
          filter: "blur(100px)",
          mixBlendMode: "screen",
        }}
        animate={{
          scale: [1, 1.25, 0.85, 1.15, 1],
          rotate: [0, 8, -5, 3, 0],
          opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Multiple dynamic glowing orbs */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255, 182, 193, 0.8) 10%, transparent 80%)",
          filter: "blur(50px)",
          top: "10%",
          left: "10%",
        }}
        animate={{
          x: [0, 150, -80, 100, 0],
          y: [0, 80, 120, -50, 0],
          scale: [1, 1.3, 0.8, 1.2, 1],
          opacity: [0.6, 0.9, 0.5, 0.7, 0.6],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(186, 85, 211, 0.6) 10%, transparent 80%)",
          filter: "blur(60px)",
          bottom: "15%",
          right: "15%",
        }}
        animate={{
          x: [0, -120, 70, -80, 0],
          y: [0, -100, -40, 90, 0],
          scale: [1, 0.8, 1.4, 0.9, 1],
          opacity: [0.5, 0.7, 0.3, 0.6, 0.5],
        }}
        transition={{
          duration: 28,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(135, 206, 250, 0.5) 10%, transparent 80%)",
          filter: "blur(40px)",
          bottom: "30%",
          left: "30%",
        }}
        animate={{
          x: [0, 100, -120, 60, 0],
          y: [0, -70, 30, 110, 0],
          scale: [1, 1.2, 0.7, 1.1, 1],
          opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
        }}
        transition={{
          duration: 22,
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
