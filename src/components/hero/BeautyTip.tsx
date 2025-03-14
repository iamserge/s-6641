
import { motion } from "framer-motion";

interface BeautyTipProps {
  tip: string | null;
  showTip?: boolean;
}

const BeautyTip = ({ showTip = true, tip }: BeautyTipProps) => {
  if (!showTip || !tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeIn" }}
      className="mt-4"
    >
      <p className="text-lg font-light text-gray-800 mb-2">Beauty Tip</p>
      <p className="text-sm text-gray-600 italic">{tip}</p>
    </motion.div>
  );
};

export default BeautyTip;
