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

  // Append return_to param so Shopify sends user back to our app
  const checkoutUrl = cart?.checkoutUrl
    ? cart.checkoutUrl + (cart.checkoutUrl.includes('?') ? '&' : '?')
      + 'return_to=' + encodeURIComponent(window.location.origin)
    : null;

  if (!cartOpen) return null;

  return (
    <>
      <style>{`
        .cm-backdrop {
          position: fixed; inset: 0; z-index: 140;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
          animation: cmFadeIn 0.2s ease;
        }
        @keyframes cmFadeIn { from{opacity:0} to{opacity:1} }

        .cm-modal {
          position: fixed; top: 50%; left: 50%; z-index: 141;
          transform: translate(-50%, -50%);
          width: min(460px, 94vw);
          max-height: 85vh;
          background: #0f0f0f;
          border: 1px solid rgba(255,59,0,0.2);
          display: flex; flex-direction: column;
          animation: cmSlideUp 0.3s cubic-bezier(0.23,1,0.32,1);
          font-family: 'Inter', sans-serif;
        }
        @keyframes cmSlideUp {
          from { transform: translate(-50%, calc(-50% + 20px)); opacity: 0; }
          to   { transform: translate(-50%, -50%); opacity: 1; }
        }

        .cm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .cm-header-title {
          display: flex; align-items: center; gap: 10px;
        }
        .cm-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 22px; letter-spacing: 3px; color: #fff;
        }
        .cm-count {
          background: #FF3B00; color: #fff;
          font-size: 10px; font-weight: 800;
          width: 20px; height: 20px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .cm-close {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; transition: background 0.2s, color 0.2s;
        }
        .cm-close:hover { background: rgba(255,59,0,0.15); color: #fff; border-color: rgba(255,59,0,0.3); }

        .cm-items {
          flex: 1; overflow-y: auto;
          padding: 8px 0;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,59,0,0.2) transparent;
        }
        .cm-items::-webkit-scrollbar { width: 3px; }
        .cm-items::-webkit-scrollbar-thumb { background: rgba(255,59,0,0.3); }

        .cm-empty {
          padding: 52px 24px; text-align: center;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .cm-empty-icon { font-size: 44px; }
        .cm-empty-text { font-size: 13px; color: rgba(255,255,255,0.35); }
        .cm-empty-btn {
          margin-top: 8px; padding: 10px 22px;
          background: none; border: 1px dashed rgba(255,59,0,0.3);
          color: rgba(255,59,0,0.7); font-size: 11px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .cm-empty-btn:hover { border-color: #FF3B00; color: #FF3B00; }

        .cm-item {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .cm-item:last-child { border-bottom: none; }
        .cm-item:hover { background: rgba(255,255,255,0.02); }

        .cm-item-img {
          width: 60px; height: 60px; flex-shrink: 0;
          background: #1a1a1a; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cm-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }

        .cm-item-info { flex: 1; min-width: 0; }
        .cm-item-name {
          font-size: 13px; font-weight: 600; color: #fff;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .cm-item-variant { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 5px; }
        .cm-item-price { font-size: 13px; font-weight: 700; color: #FF3B00; }

        .cm-qty {
          display: flex; align-items: center;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .cm-qty-btn {
          width: 26px; height: 26px; background: none; border: none;
          color: rgba(255,255,255,0.5); font-size: 16px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: color 0.15s, background 0.15s; line-height: 1;
        }
        .cm-qty-btn:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .cm-qty-num {
          width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: #fff;
          border-left: 1px solid rgba(255,255,255,0.1);
          border-right: 1px solid rgba(255,255,255,0.1);
        }

        .cm-remove {
          background: none; border: none; color: rgba(255,255,255,0.2);
          cursor: pointer; padding: 4px; font-size: 12px;
          transition: color 0.15s; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .cm-remove:hover { color: #ef4444; }

        .cm-footer {
          padding: 16px 22px 20px;
          border-top: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .cm-subtotal {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 5px;
        }
        .cm-subtotal-label {
          font-size: 10px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
        }
        .cm-subtotal-amt {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px; letter-spacing: 2px; color: #fff;
        }
        .cm-note { font-size: 10px; color: rgba(255,255,255,0.2); margin-bottom: 14px; }

        .cm-btn-checkout {
          width: 100%; padding: 15px;
          background: #FF3B00; color: #fff;
          font-size: 12px; font-weight: 800; letter-spacing: 3px;
          text-transform: uppercase; border: none; cursor: pointer;
          font-family: 'Inter', sans-serif; text-decoration: none;
          display: block; text-align: center;
          transition: background 0.2s, transform 0.15s, box-shadow 0.15s;
          margin-bottom: 8px;
        }
        .cm-btn-checkout:hover {
          background: #ff4d1a; transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,59,0,0.35);
        }
        .cm-btn-continue {
          width: 100%; padding: 11px;
          background: transparent; border: 1px dashed rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.35); font-size: 11px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: color 0.2s, border-color 0.2s;
        }
        .cm-btn-continue:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.3); }
      `}</style>

      {/* Backdrop */}
      <div className="cm-backdrop" onClick={closeCart} />

      {/* Modal */}
      <div className="cm-modal">
        {/* Header */}
        <div className="cm-header">
          <div className="cm-header-title">
            <span className="cm-title">YOUR CART</span>
            {totalItems > 0 && <span className="cm-count">{totalItems}</span>}
          </div>
          <button className="cm-close" onClick={closeCart}>✕</button>
        </div>

        {/* Items */}
        <div className="cm-items">
          {lines.length === 0 ? (
            <div className="cm-empty">
              <span className="cm-empty-icon">🛍️</span>
              <p className="cm-empty-text">Your cart is empty.</p>
              <button className="cm-empty-btn" onClick={closeCart}>Continue Shopping</button>
            </div>
          ) : (
            lines.map(line => {
              const img = line.merchandise.product.images.edges[0]?.node;
              return (
                <div key={line.id} className="cm-item">
                  <div className="cm-item-img">
                    {img && <img src={img.url} alt={line.merchandise.product.title} />}
                  </div>
                  <div className="cm-item-info">
                    <p className="cm-item-name">{line.merchandise.product.title}</p>
                    {line.merchandise.title !== 'Default Title' && (
                      <p className="cm-item-variant">{line.merchandise.title}</p>
                    )}
                    <p className="cm-item-price">
                      {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                    </p>
                  </div>
                  <div className="cm-qty">
                    <button className="cm-qty-btn"
                      onClick={() => line.quantity > 1
                        ? updateLineQuantity(line.id, line.quantity - 1)
                        : removeLine(line.id)
                      }>−</button>
                    <span className="cm-qty-num">{line.quantity}</span>
                    <button className="cm-qty-btn"
                      onClick={() => updateLineQuantity(line.id, line.quantity + 1)}>+</button>
                  </div>
                  <button className="cm-remove" onClick={() => removeLine(line.id)}>✕</button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && subtotal && (
          <div className="cm-footer">
            <div className="cm-subtotal">
              <span className="cm-subtotal-label">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
              <span className="cm-subtotal-amt">{formatPrice(subtotal.amount, subtotal.currencyCode)}</span>
            </div>
            <p className="cm-note">Shipping & taxes calculated at checkout</p>
            {checkoutUrl && (
              <a href={checkoutUrl} className="cm-btn-checkout">CHECKOUT →</a>
            )}
            <button className="cm-btn-continue" onClick={closeCart}>Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  );
}