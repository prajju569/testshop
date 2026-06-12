import { useEffect } from 'react';
import { useCart } from '../CartContext';
import { formatPrice } from '../shopify';

export default function CartModal() {
  const { cart, cartOpen, closeCart, totalItems, updateLineQuantity, removeLine } = useCart();

  useEffect(() => {
    if (!cartOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeCart(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cartOpen, closeCart]);

  const lines = cart?.lines.edges.map(e => e.node) ?? [];
  const subtotal = cart?.cost.subtotalAmount;

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                {totalItems > 0 && (
                  <span className="text-xs font-semibold text-white bg-black rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                  <div className="text-4xl">🛍️</div>
                  <p className="text-gray-500 text-sm">Your cart is empty.</p>
                  <button onClick={closeCart} className="text-sm font-medium text-black underline underline-offset-2">
                    Continue shopping
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {lines.map(line => {
                    const img = line.merchandise.product.images.edges[0]?.node;
                    return (
                      <div key={line.id} className="flex gap-4 items-start">
                        {/* Product image */}
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                          {img && <img src={img.url} alt={img.altText || line.merchandise.product.title} className="w-full h-full object-cover" />}
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                            {line.merchandise.product.title}
                          </p>
                          {line.merchandise.title !== 'Default Title' && (
                            <p className="text-xs text-gray-500 mt-0.5">{line.merchandise.title}</p>
                          )}
                          <p className="text-sm font-medium text-gray-800 mt-1">
                            {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                          </p>
                          {/* Quantity controls */}
                          <div className="flex items-center gap-0 border border-gray-200 rounded-lg w-fit overflow-hidden mt-2">
                            <button
                              onClick={() => line.quantity > 1
                                ? updateLineQuantity(line.id, line.quantity - 1)
                                : removeLine(line.id)
                              }
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                            >−</button>
                            <span className="w-7 h-7 flex items-center justify-center text-gray-800 text-xs font-medium border-x border-gray-200">{line.quantity}</span>
                            <button
                              onClick={() => updateLineQuantity(line.id, line.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                            >+</button>
                          </div>
                        </div>
                        {/* Remove */}
                        <button
                          onClick={() => removeLine(line.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                          aria-label="Remove item"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && subtotal && (
              <div className="px-6 pb-6 pt-4 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatPrice(subtotal.amount, subtotal.currencyCode)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 text-center">Shipping & taxes calculated at checkout</p>
                <a
                  href={cart?.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 bg-black text-white text-sm font-semibold rounded-xl text-center hover:bg-gray-800 transition-colors active:scale-[0.99]"
                >
                  Checkout →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
