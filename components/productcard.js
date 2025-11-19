import React from 'react';
import { Button } from '@/components/ui/button';

export default function ProductCard({ product }) {
  const { title, price, stock, image } = product;

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500">No Image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate" title={title}>
          {title}
        </h3>
        
        {/* --- FIXED TYPO HERE: Changed </f> to </p> --- */}
        <p className="text-xl font-bold text-gray-900 mt-2">
          {formattedPrice}
        </p>
        {/* ------------------------------------------- */}

        {stock > 0 ? (
          <span className="text-sm font-medium text-green-600">
            {stock} in stock
          </span>
        ) : (
          <span className="text-sm font-medium text-red-600">
            Out of Stock
          </span>
        )}
        
        <Button 
          className="mt-4 w-full" 
          disabled={stock <= 0}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}