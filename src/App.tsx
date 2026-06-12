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

  useEffect(() => {
    async function fetchProducts() {
      const response = await shopifyFetch({ query: PRODUCTS_QUERY });
      const fetchedProducts = response.data.products.edges.map((edge: any) => edge.node);
      setProducts(fetchedProducts);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your collection...</div>;

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>New Sportswear & Shoes</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
        {products.map((product) => {
          const image = product.images.edges[0]?.node;
          const price = product.priceRange.minVariantPrice;
          
          return (
            <div key={product.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
              {image && (
                <img 
                  src={image.url} 
                  alt={image.altText || product.title} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} 
                />
              )}
              <h2 style={{ fontSize: '1.25rem', margin: '0.5rem 0' }}>{product.title}</h2>
              <p style={{ color: '#666', fontWeight: 'bold' }}>
                {parseFloat(price.amount).toLocaleString('en-US', { style: 'currency', currency: price.currencyCode })}
              </p>
              <button style={{ width: '100%', padding: '0.5rem', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '0.5rem', cursor: 'pointer' }}>
                View Product
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}