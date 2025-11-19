import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header'; // <-- Import new Header

// Animation variants (use existing variants from uploaded:index.js)
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7 } }
};

const stagger = {
  show: { transition: { staggerChildren: 0.12 } }
};

// Simplified Product Card (for homepage)
function ProductCard({ product }) {
  // Use existing ProductCard logic from pages/index.js
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 p-5 hover:shadow-lg transition-all"
    >
      <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
        <span className="text-gray-400 dark:text-gray-500">No Image</span>
      </div>
      <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-50">{product.title}</h4>
      <p className="text-gray-500 dark:text-gray-400 text-sm">SKU: {product.sku}</p>
      <p className="text-blue-600 font-bold text-xl mt-2">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}
      </p>
    </motion.div>
  );
}


export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... (rest of useEffect remains the same as in uploaded:index.js)
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?page=1&limit=6');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products);
        }
      } catch (error) {
        console.error("Failed to fetch products for landing page", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <>
      <Head>
        <title>Nandan Traders — Wholesale Platform</title>
        <meta name="description" content="Welcome to Nandan Traders B2B wholesale platform." />
      </Head>
      
      {/* 1. Use the new Header component */}
      <Header /> 
      
      {/* 2. Apply dark mode classes to the main container */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        
        <main className="container mx-auto px-4 py-12">
          
          {/* Hero Section */}
          <motion.section 
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-extrabold text-gray-900 dark:text-gray-50 mb-4">
              Wholesale Management Platform
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              The all-in-one cloud solution for fast inventory, POS sales, and seamless B2B operations.
            </p>
            <Link href="/catalog" passHref legacyBehavior>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                View Public Catalog
              </Button>
            </Link>
          </motion.section>

          {/* Featured Products Grid */}
          <section>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-8 text-center">
              Featured Items
            </h3>
            
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Loading products...</div>
            ) : (
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
            
            <div className="text-center mt-10">
              <Link href="/catalog" passHref legacyBehavior>
                <Button variant="link" className="text-blue-600 dark:text-blue-400 text-lg hover:no-underline">
                  View Full Catalog →
                </Button>
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-8">
          <div className="container mx-auto px-4 text-center text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Nandan Traders. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}