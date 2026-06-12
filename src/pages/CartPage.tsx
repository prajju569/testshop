import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPrice } from '../shopify';

export default function CartPage() {
  const { cart, updateLineQuantity, removeLine, loading, totalItems } = useCart();
  const navigate = useNavigate();
  const [lidOpen, setLidOpen] = useState(false);
  const [itemsVisible, setItemsVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const lines = cart?.lines.edges.map(e => e.node) ?? [];
  const subtotal = cart?.cost.subtotalAmount;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const t1 = setTimeout(() => setLidOpen(true), 500);
    const t2 = setTimeout(() => setItemsVisible(true), 1300);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleBack = () => {
    setLeaving(true);
    setItemsVisible(false);
    setTimeout(() => setLidOpen(false), 150);
    setTimeout(() => navigate('/'), 650);
  };

  const handleCheckout = () => {
    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl;
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className={`cp ${leaving ? 'cp--out' : ''}`}>
      <div className="cp-bg" onClick={handleBack} />

      <button className="cp-back" onClick={handleBack}>← BACK</button>

      <div className="cp-box">
        {/* LID */}
        <div className={`cp-lid ${lidOpen ? 'cp-lid--open' : ''}`}>
          <div className="cp-lid-top">
            <div className="cp-lid-band" />
            <div className="cp-lid-logo">LOTTO</div>
            <div className="cp-lid-sub">ATHLETIC — SS 2026</div>
            <div className="cp-lid-stripes">
              {[...Array(7)].map((_, i) => <div key={i} className="cp-stripe" />)}
            </div>
          </div>
          <div className="cp-lid-edge">
            <span>LOTTO</span>
          </div>
        </div>

        {/* BODY */}
        <div className="cp-body">
          <div className="cp-body-label">
            <span className="cp-brand">LOTTO</span>
            <span className="cp-brand-sub">PERFORMANCE FOOTWEAR</span>
            <div className="cp-barcode">
              {[...Array(22)].map((_, i) => (
                <div key={i} className="cp-bar" style={{ width: i % 4 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1.5px' }} />
              ))}
            </div>
          </div>

          <div className="cp-content">
            {lines.length === 0 ? (
              <div className={`cp-empty ${itemsVisible ? 'cp-empty--in' : ''}`}>
                <span style={{ fontSize: 52, display: 'block', marginBottom: 16 }}>📦</span>
                <p>Your box is empty.</p>
                <button className="cp-btn-shop" onClick={handleBack}>Keep Shopping</button>
              </div>
            ) : (
              <div className="cp-items">
                {lines.map((line, i) => {
                  const img = line.merchandise.product.images.edges[0]?.node;
                  return (
                    <div
                      key={line.id}
                      className={`cp-item ${itemsVisible ? 'cp-item--in' : ''}`}
                      style={{ transitionDelay: `${i * 100}ms` }}
                    >
                      <div className="cp-item-img">
                        {img && <img src={img.url} alt={line.merchandise.product.title} />}
                      </div>
                      <div className="cp-item-info">
                        <p className="cp-item-name">{line.merchandise.product.title}</p>
                        {line.merchandise.title !== 'Default Title' && (
                          <p className="cp-item-variant">{line.merchandise.title}</p>
                        )}
                        <p className="cp-item-price">{formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}</p>
                      </div>
                      <div className="cp-qty">
                        <button className="cp-qty-btn" disabled={loading}
                          onClick={() => line.quantity > 1 ? updateLineQuantity(line.id, line.quantity - 1) : removeLine(line.id)}>−</button>
                        <span>{line.quantity}</span>
                        <button className="cp-qty-btn" disabled={loading}
                          onClick={() => updateLineQuantity(line.id, line.quantity + 1)}>+</button>
                      </div>
                      <button className="cp-remove" onClick={() => removeLine(line.id)} aria-label="Remove">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {lines.length > 0 && (
            <div className={`cp-footer ${itemsVisible ? 'cp-footer--in' : ''}`}>
              <div className="cp-subtotal">
                <span>SUBTOTAL ({totalItems} {totalItems === 1 ? 'ITEM' : 'ITEMS'})</span>
                {subtotal && <span className="cp-total-amt">{formatPrice(subtotal.amount, subtotal.currencyCode)}</span>}
              </div>
              <p className="cp-note">Shipping & taxes at checkout</p>
              <button className="cp-btn-checkout" onClick={handleCheckout}>CHECKOUT →</button>
              <button className="cp-btn-continue" onClick={handleBack}>Continue Shopping</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .cp { position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;animation:cpIn 0.45s cubic-bezier(0.23,1,0.32,1) both; }
        .cp--out { animation:cpOut 0.45s cubic-bezier(0.23,1,0.32,1) forwards; }
        @keyframes cpIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes cpOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.97)} }

        .cp-bg { position:absolute;inset:0;background:rgba(4,4,4,0.97);backdrop-filter:blur(10px); }

        .cp-back { position:fixed;top:28px;left:40px;z-index:10;background:none;border:1px dashed rgba(255,255,255,0.18);color:rgba(255,255,255,0.45);font-size:11px;font-weight:700;letter-spacing:3px;padding:10px 18px;cursor:pointer;font-family:'Inter',sans-serif;transition:color 0.2s,border-color 0.2s; }
        .cp-back:hover { color:#fff;border-color:rgba(255,255,255,0.5); }

        /* BOX WRAP */
        .cp-box { position:relative;z-index:5;width:min(560px,92vw);perspective:1400px;animation:boxSlideIn 0.55s cubic-bezier(0.23,1,0.32,1) 0.08s both; }
        @keyframes boxSlideIn { from{transform:translateY(36px) scale(0.95);opacity:0} to{transform:none;opacity:1} }

        /* LID */
        .cp-lid { transform-origin:top center;transform:rotateX(0deg);transition:transform 0.95s cubic-bezier(0.23,1,0.32,1);transform-style:preserve-3d;margin-bottom:-2px;position:relative;z-index:6; }
        .cp-lid--open { transform:rotateX(-122deg) translateY(-10px); }
        .cp-lid-top { background:#D4401A;border:3px solid #7A2000;border-bottom:none;padding:26px 32px 20px;position:relative;overflow:hidden;box-shadow:inset 0 -6px 16px rgba(0,0,0,0.25); }
        .cp-lid-band { position:absolute;top:0;left:0;right:0;height:7px;background:#7A2000; }
        .cp-lid-logo { font-family:'Bebas Neue',sans-serif;font-size:44px;letter-spacing:8px;color:rgba(255,255,255,0.95);line-height:1;text-shadow:2px 3px 0 rgba(0,0,0,0.2); }
        .cp-lid-sub { font-size:10px;font-weight:700;letter-spacing:4px;color:rgba(255,255,255,0.5);margin-top:5px;text-transform:uppercase; }
        .cp-lid-stripes { position:absolute;right:0;top:0;bottom:0;display:flex;gap:5px;padding:0 22px;align-items:stretch;opacity:0.12; }
        .cp-stripe { width:9px;background:#fff; }
        .cp-lid-edge { background:#B83510;border:3px solid #7A2000;border-top:none;border-bottom:none;padding:7px 32px;display:flex;align-items:center; }
        .cp-lid-edge span { font-family:'Bebas Neue',sans-serif;font-size:13px;letter-spacing:5px;color:rgba(255,255,255,0.3); }

        /* BODY */
        .cp-body { background:#E8420E;border:3px solid #7A2000;border-top:none;display:flex;flex-direction:column;max-height:68vh;box-shadow:0 28px 80px rgba(0,0,0,0.65),inset 0 2px 0 rgba(255,255,255,0.06); }
        .cp-body-label { background:#7A2000;padding:11px 24px;display:flex;align-items:center;gap:16px;border-bottom:2px solid rgba(0,0,0,0.25);flex-shrink:0; }
        .cp-brand { font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:5px;color:rgba(255,255,255,0.9); }
        .cp-brand-sub { font-size:9px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.35);text-transform:uppercase; }
        .cp-barcode { display:flex;gap:1.5px;align-items:stretch;height:26px;margin-left:auto; }
        .cp-bar { background:rgba(255,255,255,0.22); }

        /* CONTENT */
        .cp-content { flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(0,0,0,0.3) transparent; }
        .cp-content::-webkit-scrollbar{width:4px;}
        .cp-content::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.3);border-radius:2px;}

        .cp-empty { padding:52px 32px;text-align:center;opacity:0;transform:translateY(14px);transition:opacity 0.5s,transform 0.5s; }
        .cp-empty--in { opacity:1;transform:none; }
        .cp-empty p { color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:22px; }
        .cp-btn-shop { background:rgba(0,0,0,0.25);color:#fff;border:1px dashed rgba(255,255,255,0.3);padding:11px 22px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:'Inter',sans-serif;transition:background 0.2s; }
        .cp-btn-shop:hover { background:rgba(0,0,0,0.4); }

        .cp-items { padding:2px 0; }
        .cp-item { display:flex;align-items:center;gap:14px;padding:14px 22px;border-bottom:1px solid rgba(0,0,0,0.15);background:rgba(0,0,0,0.08);opacity:0;transform:translateX(-18px);transition:opacity 0.4s,transform 0.4s,background 0.2s; }
        .cp-item:last-child { border-bottom:none; }
        .cp-item--in { opacity:1;transform:none; }
        .cp-item:hover { background:rgba(0,0,0,0.18); }
        .cp-item-img { width:62px;height:62px;flex-shrink:0;background:rgba(0,0,0,0.2);border-radius:4px;overflow:hidden;border:1px solid rgba(255,255,255,0.1); }
        .cp-item-img img { width:100%;height:100%;object-fit:cover; }
        .cp-item-info { flex:1;min-width:0; }
        .cp-item-name { font-size:13px;font-weight:600;color:#fff;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .cp-item-variant { font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px; }
        .cp-item-price { font-size:13px;font-weight:700;color:rgba(255,255,255,0.9); }

        .cp-qty { display:flex;align-items:center;border:1px solid rgba(255,255,255,0.2);border-radius:4px;overflow:hidden;flex-shrink:0; }
        .cp-qty-btn { width:28px;height:28px;background:rgba(0,0,0,0.2);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;line-height:1; }
        .cp-qty-btn:hover { background:rgba(0,0,0,0.4); }
        .cp-qty-btn:disabled { opacity:0.4;cursor:not-allowed; }
        .cp-qty span { width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;color:#fff;border-left:1px solid rgba(255,255,255,0.2);border-right:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.1); }

        .cp-remove { background:none;border:none;color:rgba(255,255,255,0.28);cursor:pointer;padding:6px;border-radius:4px;font-size:13px;transition:color 0.2s,background 0.2s;flex-shrink:0; }
        .cp-remove:hover { color:#fff;background:rgba(0,0,0,0.25); }

        /* FOOTER */
        .cp-footer { padding:18px 22px;background:#7A2000;border-top:2px solid rgba(0,0,0,0.25);opacity:0;transform:translateY(10px);transition:opacity 0.5s 0.25s,transform 0.5s 0.25s;flex-shrink:0; }
        .cp-footer--in { opacity:1;transform:none; }
        .cp-subtotal { display:flex;justify-content:space-between;align-items:center;margin-bottom:5px; }
        .cp-subtotal span { font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,0.5);text-transform:uppercase; }
        .cp-total-amt { font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:2px;color:#fff; }
        .cp-note { font-size:10px;color:rgba(255,255,255,0.3);margin-bottom:14px; }
        .cp-btn-checkout { width:100%;padding:15px;background:#fff;color:#7A2000;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:background 0.2s,transform 0.15s,box-shadow 0.15s;margin-bottom:9px; }
        .cp-btn-checkout:hover { background:#f0f0f0;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.3); }
        .cp-btn-checkout:active { transform:none; }
        .cp-btn-continue { width:100%;padding:11px;background:transparent;color:rgba(255,255,255,0.45);font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border:1px dashed rgba(255,255,255,0.2);cursor:pointer;font-family:'Inter',sans-serif;transition:color 0.2s,border-color 0.2s; }
        .cp-btn-continue:hover { color:#fff;border-color:rgba(255,255,255,0.5); }

        @media(max-width:600px){
          .cp-box{width:95vw;}
          .cp-back{top:14px;left:14px;}
          .cp-lid-logo{font-size:34px;}
          .cp-item{padding:11px 14px;gap:10px;}
          .cp-footer{padding:14px 16px;}
        }
      `}</style>
    </div>
  );
}