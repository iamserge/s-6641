
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const Navbar = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = scrollY.onChange(value => {
      setIsScrolled(value > window.innerHeight - 100);
    });
    return () => unsubscribe();
  }, [scrollY]);

  const backgroundColor = useTransform(
    scrollY,
    [0, window.innerHeight - 100],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]
  );

  const borderOpacity = useTransform(
    scrollY,
    [0, window.innerHeight - 100],
    [0, 1]
  );

  return (
    <motion.nav 
      className="fixed w-full z-50 px-6 py-4 backdrop-blur-sm"
      style={{ 
        backgroundColor,
        borderBottom: borderOpacity.get() > 0 ? "1px solid rgba(236, 72, 153, 0.1)" : "none"
      }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/52ac84d3-c972-4947-9aab-008fcc78be99.png" 
            alt="Dupe Academy Logo" 
            className="h-8"
          />
          <span className="text-gray-600 font-light ml-auto">
            Save on your favorite products
          </span>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
