
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import RecentDupes from "../components/RecentDupes";
import AnimatedBackground from "../components/AnimatedBackground";

const Index = () => {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <Navbar />
      
      <div className="relative">
        <Hero />
        <section className="container mx-auto px-4 py-12">
          <RecentDupes />
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
