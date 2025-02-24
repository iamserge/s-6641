import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight, Star, ExternalLink } from "lucide-react";

interface Resource {
  title: string;
  url: string;
  type: "Video" | "YouTube" | "Instagram" | "TikTok" | "Article";
}

interface Dupe {
  name: string;
  brand: string;
  price: number;
  savingsPercentage: number;
  keyIngredients: string[];
  texture: string;
  finish: string;
  spf?: number;
  skinTypes: string[];
  matchScore: number;
  notes: string;
  purchaseLink?: string;
}

interface OriginalProduct {
  name: string;
  brand: string;
  price: number;
  attributes: string[];
  imageUrl?: string;
}

interface DupeSearchResult {
  original: OriginalProduct;
  dupes: Dupe[];
  summary: string;
  resources: Resource[];
}

interface ResultsGalleryProps {
  data?: DupeSearchResult;
}

const mockResults: DupeSearchResult = {
  original: {
    name: "Shape Tape Concealer",
    brand: "Tarte",
    price: 32,
    attributes: [
      "Full coverage",
      "Natural matte finish",
      "16-hour wear",
      "Waterproof",
      "Shea butter & mango seed butter",
      "Licorice root for brightening",
      "Creamy silicone-based formula",
      "Cruelty-free & vegan"
    ],
    imageUrl: "https://tartecosmetics.com/dw/image/v2/BCWX_PRD/on/demandware.static/-/Sites-tarte-product-catalog/default/dw0d0c0d0e/images/2023/global/shape-tape-concealer/2501218_shape-tape-concealer_swatch.jpg?sw=400&sh=400"
  },
  dupes: [
    {
      name: "Infallible Full Wear Waterproof Concealer",
      brand: "L'Oréal",
      price: 14.99,
      savingsPercentage: 53,
      keyIngredients: ["Glycerin", "Dimethicone"],
      texture: "Creamy",
      finish: "Matte",
      skinTypes: ["Oily", "Combination"],
      matchScore: 95,
      notes: "Nearly identical formula/applicator to Shape Tape",
      purchaseLink: "https://www.lorealparisusa.com"
    },
    {
      name: "Conceal & Define Full Coverage Concealer",
      brand: "Makeup Revolution",
      price: 7,
      savingsPercentage: 78,
      keyIngredients: ["Vitamin E", "Hyaluronic Acid"],
      texture: "Lightweight",
      finish: "Natural matte",
      skinTypes: ["All skin types"],
      matchScore: 90,
      notes: "Cruelty-free alternative with similar doe-foot applicator"
    },
    {
      name: "Camo Concealer",
      brand: "e.l.f.",
      price: 7,
      savingsPercentage: 78,
      keyIngredients: ["Avocado oil", "Kaolin clay"],
      texture: "Hydrating cream",
      finish: "Semi-matte",
      skinTypes: ["Dry", "Mature"],
      matchScore: 85,
      notes: "More emollient formula for dry skin types"
    },
    {
      name: "Photo Focus Concealer",
      brand: "Wet n Wild",
      price: 5,
      savingsPercentage: 84,
      keyIngredients: ["Glycerin"],
      texture: "Creamy liquid",
      finish: "Natural matte",
      skinTypes: ["Oily", "Combination"],
      matchScore: 88,
      notes: "Cruelty-free option with comparable coverage"
    }
  ],
  summary: "The L'Oréal Infallible concealer emerges as the closest dupe (95% match) to Tarte Shape Tape in both formula and performance at less than half the price.",
  resources: [
    {
      title: "Battle of the Dupes: TARTE SHAPE TAPE vs Drugstore Alternatives",
      url: "https://www.youtube.com/watch?v=yviwi2x6Uww",
      type: "YouTube"
    },
    {
      title: "Full-Coverage Drugstore Concealers: Best Tarte Shape Tape Dupes",
      url: "https://www.ashleybrookenicholas.com/best-full-coverage-drugstore-concealers-tarte-shape-tape-dupes.html",
      type: "Article"
    },
    {
      title: "Tarte Shape Tape vs E.L.F Camo Concealer Comparison",
      url: "https://www.purewow.com/beauty/what-the-dupe-tarte-shape-tape-elf-concealer",
      type: "Article"
    },
    {
      title: "$3 Shape Tape Dupe Demonstration",
      url: "https://www.youtube.com/watch?v=wDN3eIig6GA",
      type: "YouTube"
    },
    {
      title: "Tarte Shape Tape Concealer Review & Comparison Guide",
      url: "https://terilynadams.com/tarte-shape-tape-concealer-review/",
      type: "Article"
    }
  ]
};

const ResultsGallery = ({ data = mockResults }: ResultsGalleryProps) => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{data.original.name}</CardTitle>
              <CardDescription className="text-lg">{data.original.brand}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              ${data.original.price}
            </Badge>
          </div>
          {data.original.imageUrl && (
            <img
              src={data.original.imageUrl}
              alt={data.original.name}
              className="w-full max-w-md mx-auto rounded-lg shadow-lg"
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.original.attributes.map((attribute, index) => (
              <Badge key={index} variant="outline" className="justify-center">
                {attribute}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-green-50">
        <CardContent className="py-6">
          <p className="text-lg text-center font-medium text-gray-700">{data.summary}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.dupes.map((dupe, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{dupe.name}</CardTitle>
                  <CardDescription>{dupe.brand}</CardDescription>
                </div>
                <Badge variant="default" className="bg-green-500">
                  {dupe.matchScore}% Match
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${dupe.price}</span>
                <Badge variant="secondary" className="text-green-700">
                  Save {dupe.savingsPercentage}%
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {dupe.keyIngredients.map((ingredient, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium">Texture:</p>
                    <p>{dupe.texture}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">Finish:</p>
                    <p>{dupe.finish}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="font-medium">Suitable for:</p>
                  <div className="flex flex-wrap gap-1">
                    {dupe.skinTypes.map((type, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {dupe.notes && (
                  <p className="text-sm text-gray-600 italic">
                    {dupe.notes}
                  </p>
                )}
              </div>

              {dupe.purchaseLink && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => window.open(dupe.purchaseLink, '_blank')}
                >
                  Shop Now <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50 transition-colors border"
              >
                <Badge variant="outline">{resource.type}</Badge>
                <span className="flex-1 text-sm">{resource.title}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsGallery;
