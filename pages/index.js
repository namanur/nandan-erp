// pages/index.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function LandingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch a few products to display
  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch the first 6 products
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
        <title>Nandan Traders - Wholesale Platform</title>
        <meta name="description" content="Welcome to the Nandan Traders B2B wholesale platform." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Nandan Traders
            </h1>
            <Link href="/admin" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Admin Login
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main>
          <section className="bg-white py-20 md:py-32">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Nandan Traders V1
              </h2>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Welcome to your new wholesale platform. Browse products, manage inventory, and track orders all in one place.
              </p>
              <a 
                href="#featured-products" 
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                View Products
              </a>
            </div>
          </section>

          {/* Featured Products Section */}
          <section id="featured-products" className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
                Featured Products
              </h3>
              
              {loading ? (
                <div className="text-center text-gray-500">Loading products...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-8">
          <div className="container mx-auto px-4 text-center text-gray-500">
            &copy; 2025 Nandan Traders. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}

// Helper component for the product card
function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg">
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {/* Placeholder for image. You can use an <img> tag if you have image URLs */}
        <span className="text-gray-400">Preview N/A</span>
      </div>
      <div className="p-6">
        <h4 className="text-lg font-semibold text-gray-800 truncate">{product.title}</h4>
        <p className="text-sm text-gray-500 mb-2">{product.category || 'Uncategorized'}</p>
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-gray-900">
            ₹{product.price.toFixed(2)}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
          </span>
        </div>
      </div>
    </div>
  );
}