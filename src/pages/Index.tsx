
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchSection from "../components/SearchSection";
import ResultsGallery from "../components/ResultsGallery";
import Footer from "../components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      <Hero />
      <SearchSection />
      <ResultsGallery />
      <Footer />
    </div>
  );
};

export default Index;
