
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface DupeProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  matchScore: number;
  affiliateLink: string;
}

const mockDupes: DupeProduct[] = [
  {
    id: "1",
    name: "Stay All Day Foundation",
    brand: "BeautyBrand",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
    matchScore: 95,
    affiliateLink: "#",
  },
  // Add more mock products as needed
];

const ResultsGallery = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockDupes.map((dupe) => (
          <Card key={dupe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="p-4">
              <img
                src={dupe.image}
                alt={dupe.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-lg mb-2">{dupe.name}</CardTitle>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{dupe.brand}</p>
                <p className="font-semibold">${dupe.price.toFixed(2)}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${dupe.matchScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{dupe.matchScore}% match</span>
                </div>
                <Button
                  className="w-full mt-4"
                  onClick={() => window.open(dupe.affiliateLink, "_blank")}
                >
                  Buy Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default ResultsGallery;
