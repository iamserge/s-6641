
import { motion } from "framer-motion";

interface TaglineAnimationProps {
  taglineWords: string[];
}

const TaglineAnimation = ({ taglineWords }: TaglineAnimationProps) => {
  const wordAnimation = {
    hidden: { opacity: 0, filter: "blur(10px)", scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        delay: 0.7 + (i * 0.1),
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    })
  };

  return (
    <div className="mb-4 flex flex-wrap justify-center">
      {taglineWords.map((word, i) => (
        <motion.span
          key={i}
          className="text-2xl md:text-3xl text-gray-800 font-light tracking-wide inline-block mx-1"
          custom={i}
          initial="hidden"
          animate="visible"
          variants={wordAnimation}
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default TaglineAnimation;
