
import { lazy, Suspense, useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";
import HowItWorks from "../components/HowItWorks";
import Features from "../components/Features";
import PopularCategories from "../components/PopularCategories";
import Testimonials from "../components/Testimonials";
import NewsletterCTA from "../components/NewsletterCTA";

// Lazy load these components with better chunk naming
const Hero = lazy(() => import("../components/Hero" /* webpackChunkName: "hero" */));
const RecentDupes = lazy(() => import("../components/RecentDupes" /* webpackChunkName: "recent-dupes" */));
const AnimatedBackground = lazy(() => import("../components/AnimatedBackground" /* webpackChunkName: "animated-bg" */));

// Optimized loading fallback component
const LoadingFallback = () => (
  <div className="flex h-40 w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Defer non-critical UI until after main content is loaded
  useEffect(() => {
    if (document.readyState === 'complete') {
      setIsLoaded(true);
    } else {
      window.addEventListener('load', () => setIsLoaded(true));
      return () => window.removeEventListener('load', () => setIsLoaded(true));
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Use a separate Suspense boundary for the background to not block content */}
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-pink-50" />}>
        <AnimatedBackground />
      </Suspense>
      
      <Navbar />
      
      <div className="relative">
        <Suspense fallback={<LoadingFallback />}>
          <Hero />
        </Suspense>
        
        <HowItWorks />
        
        <PopularCategories />
        
        {/* Only load RecentDupes when page has loaded */}
        {isLoaded && (
          <section className="container mx-auto px-4 py-12">
            <Suspense fallback={<LoadingFallback />}>
              <RecentDupes />
            </Suspense>
          </section>
        )}
        
        <Features />
        
        <Testimonials />
        
        <NewsletterCTA />
      </div>

      <Footer />
    </div>
  );
};

export default Index;
