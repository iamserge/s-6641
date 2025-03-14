
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const categories = [
  {
    id: 1,
    name: "Skincare",
    image: "/cream.png",
    color: "bg-blue-100",
    description: "Find affordable alternatives to luxury serums, creams and treatments"
  },
  {
    id: 2,
    name: "Makeup",
    image: "/compact.png",
    color: "bg-pink-100",
    description: "Discover budget-friendly dupes for high-end foundations, lipsticks and more"
  },
  {
    id: 3,
    name: "Haircare",
    image: "/spray.png",
    color: "bg-purple-100",
    description: "Save on premium shampoos, conditioners and styling products"
  },
  {
    id: 4,
    name: "Fragrance",
    image: "/tube.png",
    color: "bg-green-100",
    description: "Experience luxury scents without the luxury price tag"
  }
];

const PopularCategories = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Explore Popular Categories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find the perfect dupes in every beauty category, from skincare to makeup and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="rounded-2xl overflow-hidden border border-pink-100 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className={`${category.color} p-8 flex justify-center items-center h-48`}>
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="h-32 w-32 object-contain rounded-full bg-white/80 p-4" 
                />
              </div>
              <div className="bg-white p-6">
                <h3 className="text-xl font-semibold text-violet-800 mb-2">{category.name}</h3>
                <p className="text-gray-600 mb-4 h-16">{category.description}</p>
                <Link 
                  to={`/dupes?category=${category.name}`}
                  className="inline-block text-sm font-medium text-violet-700 hover:text-violet-900 transition-colors"
                >
                  Explore {category.name} →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCategories;
