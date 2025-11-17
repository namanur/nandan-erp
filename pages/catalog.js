// pages/catalog.js

import { useEffect, useState } from "react";

export default function Catalog() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => setProducts(data.products || []));
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Product Catalog</h1>

      {products.length === 0 && <p>No products found.</p>}

      {products.map((p) => (
        <div key={p.id} style={{
          margin: "10px 0",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "8px"
        }}>
          <h3>{p.title}</h3>
          <p>Price: ₹{p.price}</p>
          <p>Stock: {p.stock}</p>
        </div>
      ))}
    </div>
  );
}
