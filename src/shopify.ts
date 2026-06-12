// TEMPORARILY replace the import.meta.env lines with hardcoded strings:
const domain = 'demoforlotto.myshopify.com';
const token = '344577b4fff0eae49fce9fbee6a3edc9'; // Paste your clean headless token here
const version = '2026-04';

console.log("DIAGNOSTIC - Domain:", domain, "Token:", token ? "FOUND" : "MISSING");

export async function shopifyFetch({ query, variables = {} }: { query: string; variables?: object }) {
  const url = `https://${domain}/api/${version}/graphql.json`;

  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token, 
      },
      body: JSON.stringify({ query, variables }),
    });

    return await result.json();
  } catch (error) {
    console.error('Error fetching data from Shopify:', error);
    throw new Error('Failed to fetch data from Shopify');
  }
}