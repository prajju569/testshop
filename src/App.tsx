import { useEffect, useState } from 'react';
import { shopifyFetch } from './shopify';

const PRODUCTS_QUERY = `
  query getProducts {
    products(first: 10) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { edges: { node: { url: string; altText: string } }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await shopifyFetch({ query: PRODUCTS_QUERY });
        
        // Guardrail: Check if Shopify returned API errors
        if (response.errors) {
          console.error('Shopify API Errors:', response.errors);
          setError(response.errors[0]?.message || 'Shopify API returned an error.');
          return;
        }

        // Guardrail: Check if data structure is missing
        if (!response?.data?.products) {
          console.error('Unexpected API response structure:', response);
          setError('Could not parse product data structure from Shopify.');
          return;
        }

        const fetchedProducts = response.data.products.edges.map((edge: any) => edge.node);
        setProducts(fetchedProducts);
      } catch (err: any) {
        console.error('Network or system error:', err);
        setError(err.message || 'An unexpected system error occurred.');
      } finally {
        // This ALWAYS runs, preventing a frozen loading screen
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 font-medium">
        Loading your collection...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        <h3 className="font-bold mb-1">Storefront Fetch Error</h3>
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <p className="text-xs text-gray-500">Check your browser console (F12) for detailed logs.</p>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto p-8 font-sans">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-8">New Sportswear & Shoes</h1>
      
      {products.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
          <p className="text-lg font-medium">Your catalog is currently empty!</p>
          <p className="text-sm mt-1">Go to your Shopify Admin Panel and add your first sportswear or shoe products.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const image = product.images.edges[0]?.node;
            const price = product.priceRange.minVariantPrice;
            
            return (
              <div key={product.id} className="border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                {image && (
                  <img 
                    src={image.url} 
                    alt={image.altText || product.title} 
                    className="w-full h-56 object-cover rounded-lg bg-gray-100"
                  />
                )}
                <h2 className="text-lg font-semibold text-gray-800 mt-4 line-clamp-1">{product.title}</h2>
                <p className="text-gray-600 font-bold mt-1">
                  {parseFloat(price.amount).toLocaleString('en-US', { style: 'currency', currency: price.currencyCode })}
                </p>
                <button className="w-full mt-4 py-2 bg-black text-white font-medium rounded-lg text-sm hover:bg-gray-800 transition-colors">
                  View Product
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}