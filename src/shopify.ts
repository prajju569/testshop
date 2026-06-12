// shopify.ts — central API layer
const domain = 'demoforlotto.myshopify.com';
const token = '344577b4fff0eae49fce9fbee6a3edc9';
const version = '2026-04';

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
    console.error('Error fetching from Shopify:', error);
    throw new Error('Failed to fetch from Shopify');
  }
}

export const PRODUCTS_QUERY = `
  query getProducts {
    products(first: 20) {
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges { node { url altText } }
          }
          priceRange {
            minVariantPrice { amount currencyCode }
          }
        }
      }
    }
  }
`;

export const PRODUCT_DETAIL_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      images(first: 10) {
        edges { node { url altText } }
      }
      variants(first: 30) {
        edges {
          node {
            id
            title
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
      options { name values }
      priceRange {
        minVariantPrice { amount currencyCode }
        maxVariantPrice { amount currencyCode }
      }
    }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation cartCreate($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  price { amount currencyCode }
                  product {
                    title
                    images(first: 1) { edges { node { url altText } } }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  price { amount currencyCode }
                  product {
                    title
                    images(first: 1) { edges { node { url altText } } }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  price { amount currencyCode }
                  product {
                    title
                    images(first: 1) { edges { node { url altText } } }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id title
                  price { amount currencyCode }
                  product {
                    title
                    images(first: 1) { edges { node { url altText } } }
                  }
                }
              }
            }
          }
        }
        cost {
          subtotalAmount { amount currencyCode }
          totalAmount { amount currencyCode }
        }
      }
    }
  }
`;

// Types
export interface ProductImage {
  url: string;
  altText: string;
}

export interface Variant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: { amount: string; currencyCode: string };
  selectedOptions: { name: string; value: string }[];
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
  images: { edges: { node: ProductImage }[] };
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice?: { amount: string; currencyCode: string };
  };
  variants?: { edges: { node: Variant }[] };
  options?: ProductOption[];
}

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      title: string;
      images: { edges: { node: ProductImage }[] };
    };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  lines: { edges: { node: CartLine }[] };
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount: { amount: string; currencyCode: string };
  };
}

export function formatPrice(amount: string, currencyCode: string): string {
  return parseFloat(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: currencyCode,
  });
}
