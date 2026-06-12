const domain = import.meta.env.PUBLIC_STORE_DOMAIN;
const token = import.meta.env.PUBLIC_STOREFRONT_API_TOKEN;

export async function shopifyFetch({ query, variables = {} }: { query: string; variables?: object }) {
  const url = `https://${domain}/api/2026-04/graphql.json`;

  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // This specific header tells Shopify it's a safe, public storefront request
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