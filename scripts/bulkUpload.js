// scripts/bulkUpload.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// -----------------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------------
// Your API endpoint
const API_URL = 'http://localhost:3000/api/products';
// The path to your CSV file
const CSV_FILE_PATH = path.join(__dirname, '../items.csv');
// -----------------------------------------------------------------

async function postProduct(product) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[SUCCESS] Created: ${result.title}`);
    } else {
      const error = await response.json();
      console.error(`[FAILED] To create: ${product.title}. Error: ${error.error}`);
    }
  } catch (error) {
    console.error(`[ERROR] Network error for: ${product.title}`, error.message);
  }
}

function cleanRate(rateString) {
  // Removes "INR " and converts to a number
  if (!rateString) return 0;
  const cleaned = rateString.replace('INR ', '').trim();
  return parseFloat(cleaned) || 0;
}

function cleanStock(stockString) {
  // Converts to number, defaults to 0 if empty
  return parseInt(stockString) || 0;
}

async function processCSV() {
  console.log('--- Starting Product Upload ---');
  console.log(`Reading from: ${CSV_FILE_PATH}`);

  const productsToUpload = [];

  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
      // This mapping is based on your CSV columns
      const product = {
        title: row['Item Name'],
        price: cleanRate(row['Rate']),
        sku: row['SKU'] || null, // Use null if SKU is empty
        hsn: row['HSN/SAC'] || null,
        taxRate: parseFloat(row['Intra State Tax Rate']) || 0,
        stock: cleanStock(row['Stock On Hand']),
        // NOTE: tenantId is handled by your API file, so we don't send it here.
      };
      productsToUpload.push(product);
    })
    .on('end', async () => {
      console.log(`\nFound ${productsToUpload.length} products to upload...`);
      console.log('Starting upload in 3 seconds...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      for (const product of productsToUpload) {
        await postProduct(product);
        // Add a small delay to not overwhelm the server
        await new Promise(resolve => setTimeout(resolve, 50)); 
      }
      
      console.log('\n--- Bulk Upload Complete ---');
    });
}

processCSV();