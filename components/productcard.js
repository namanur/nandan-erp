// components/ProductCard.js
import React from 'react';

export default function ProductCard({ product }) {
  const { title, price, stock, image } = product;

  // Format price to INR
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* Image Section */}
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500">No Image</span>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate" title={title}>
          {title}
        </h3>
        
        <p className="text-xl font-bold text-gray-900 mt-2">
          {formattedPrice}
        </p>

        {stock > 0 ? (
          <span className="text-sm font-medium text-green-600">
            {stock} in stock
          </span>
        ) : (
          <span className="text-sm font-medium text-red-600">
            Out of Stock
          </span>
        )}

        <button 
          className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          disabled={stock <= 0}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}