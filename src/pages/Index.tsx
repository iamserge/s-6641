
import { lazy, Suspense } from 'react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Loader2 } from "lucide-react";

// Lazy load these components
const Hero = lazy(() => import("../components/Hero"));
const RecentDupes = lazy(() => import("../components/RecentDupes"));
const AnimatedBackground = lazy(() => import("../components/AnimatedBackground"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<div className="fixed inset-0 bg-gradient-to-b from-blue-50 to-pink-50" />}>
        <AnimatedBackground />
      </Suspense>
      
      <Navbar />
      
      <div className="relative">
        <Suspense fallback={<LoadingFallback />}>
          <Hero />
        </Suspense>
        
        <section className="container mx-auto px-4 py-12">
          <Suspense fallback={<LoadingFallback />}>
            <RecentDupes />
          </Suspense>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
