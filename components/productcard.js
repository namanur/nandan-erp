// components/ProductCard.js
import React from 'react';
import { Button } from '@/components/ui/button'; // <-- 1. IMPORT THE NEW BUTTON

export default function ProductCard({ product }) {
  const { title, price, stock, image } = product;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* ... (image and content sections remain the same) ... */}
      
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

        {/* --- 2. REPLACE THE OLD BUTTON --- */}
        <Button 
          className="mt-4 w-full" 
          disabled={stock <= 0}
        >
          Add to Cart
        </Button>
        {/* --- END OF CHANGE --- */}

      </div>
    </div>
  );
}