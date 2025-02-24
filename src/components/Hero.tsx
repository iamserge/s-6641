
import { Button } from "./ui/button";

const Hero = () => {
  return (
    <section className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
        Find Your Perfect Makeup Dupe
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
        Discover affordable alternatives to your favorite makeup products using AI-powered search
      </p>
      <Button size="lg" onClick={() => {
        const searchSection = document.querySelector('#search-section');
        searchSection?.scrollIntoView({ behavior: 'smooth' });
      }}>
        Start Searching
      </Button>
    </section>
  );
};

export default Hero;
