// pages/catalog.js
import React from 'react';
import ProductCard from '../components/ProductCard';
import { prisma } from '../lib/prisma'; // Use the server-side prisma client

// The main component function that MUST be the default export
export default function Catalog({ products }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Product Catalog
        </h1>

        {products.length === 0 ? (
          <p className="text-gray-600">No products found.</p>
        ) : (
          // This creates a responsive grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              // Ensure ProductCard is using the correct case: 'ProductCard'
              <ProductCard key={product.id} product={product} /> 
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// This runs on the SERVER to fetch data before the page loads
export async function getServerSideProps(context) {
  // Use TENANT_ID from environment or fallback to the local seed value
  const MY_TENANT_ID = process.env.TENANT_ID || "local-tenant"; 

  const products = await prisma.product.findMany({
    where: {
      tenantId: MY_TENANT_ID,
    },
    select: { 
      // Explicitly select fields
      id: true,
      title: true,
      price: true,
      stock: true,
      sku: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      title: 'asc',
    },
  });

  // We must serialize the data for Next.js (Date and Decimal objects)
  const serializableProducts = products.map(product => ({
    ...product,
    // CRITICAL FIX: Convert Prisma Decimal object to a serializable number
    price: product.price.toNumber(),
    // Convert Date objects to ISO string
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  return {
    props: {
      products: serializableProducts,
    },
  };
}