import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  shopifyFetch,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
} from './shopify';
import type { Cart } from './shopify';

interface CartContextType {
  cart: Cart | null;
  cartOpen: boolean;
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (variantId: string, quantity: number) => Promise<void>;
  updateLineQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalItems = cart?.lines.edges.reduce((sum, { node }) => sum + node.quantity, 0) ?? 0;

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const addToCart = useCallback(async (variantId: string, quantity: number) => {
    setLoading(true);
    try {
      if (!cart) {
        const res = await shopifyFetch({
          query: CART_CREATE_MUTATION,
          variables: { lines: [{ merchandiseId: variantId, quantity }] },
        });
        const newCart = res?.data?.cartCreate?.cart;
        if (newCart) setCart(newCart);
      } else {
        const res = await shopifyFetch({
          query: CART_LINES_ADD_MUTATION,
          variables: { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] },
        });
        const updatedCart = res?.data?.cartLinesAdd?.cart;
        if (updatedCart) setCart(updatedCart);
      }
      setCartOpen(true);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const updateLineQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return;
    setLoading(true);
    try {
      const res = await shopifyFetch({
        query: CART_LINES_UPDATE_MUTATION,
        variables: { cartId: cart.id, lines: [{ id: lineId, quantity }] },
      });
      const updated = res?.data?.cartLinesUpdate?.cart;
      if (updated) setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  const removeLine = useCallback(async (lineId: string) => {
    if (!cart) return;
    setLoading(true);
    try {
      const res = await shopifyFetch({
        query: CART_LINES_REMOVE_MUTATION,
        variables: { cartId: cart.id, lineIds: [lineId] },
      });
      const updated = res?.data?.cartLinesRemove?.cart;
      if (updated) setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [cart]);

  return (
    <CartContext.Provider value={{
      cart, cartOpen, loading,
      openCart, closeCart,
      addToCart, updateLineQuantity, removeLine,
      totalItems,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
