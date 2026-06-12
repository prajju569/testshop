import { useState, useEffect, useCallback, useRef } from 'react';
import { shopifyFetch, PRODUCT_DETAIL_QUERY, formatPrice } from '../shopify';
import type { Product, Variant } from '../shopify';
import { useCart } from '../CartContext';

interface ProductModalProps {
  handle: string;
  onClose: () => void;
}

export default function ProductModal({ handle, onClose }: ProductModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [flying, setFlying] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { addToCart, loading: cartLoading } = useCart();

  useEffect(() => {
    async function load() {
      try {
        const res = await shopifyFetch({ query: PRODUCT_DETAIL_QUERY, variables: { handle } });
        const p: Product = res?.data?.product;
        if (p) {
          setProduct(p);
          const defaults: Record<string, string> = {};
          p.options?.forEach(opt => { defaults[opt.name] = opt.values[0]; });
          setSelectedOptions(defaults);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [handle]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const getSelectedVariant = useCallback((): Variant | null => {
    if (!product?.variants) return null;
    return product.variants.edges.find(({ node }) =>
      node.selectedOptions.every(opt => selectedOptions[opt.name] === opt.value)
    )?.node ?? null;
  }, [product, selectedOptions]);

  const handleAddToCart = async () => {
    const variant = getSelectedVariant();
    if (!variant) return;

    // Fly animation
    const img = imgRef.current;
    const cartIcon = document.querySelector('.nav-cart') as HTMLElement;
    if (img && cartIcon) {
      const imgRect = img.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      const clone = img.cloneNode(true) as HTMLImageElement;
      clone.style.cssText = `
        position: fixed;
        left: ${imgRect.left}px;
        top: ${imgRect.top}px;
        width: ${imgRect.width}px;
        height: ${imgRect.height}px;
        object-fit: cover;
        border-radius: 8px;
        z-index: 9999;
        pointer-events: none;
        transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        transform-origin: center;
      `;
      document.body.appendChild(clone);
      setFlying(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clone.style.left = `${cartRect.left + cartRect.width / 2 - 20}px`;
          clone.style.top = `${cartRect.top + cartRect.height / 2 - 20}px`;
          clone.style.width = '40px';
          clone.style.height = '40px';
          clone.style.opacity = '0.8';
          clone.style.borderRadius = '50%';
          clone.style.transform = 'scale(0.3) rotate(10deg)';
        });
      });

      setTimeout(() => {
        clone.remove();
        setFlying(false);
        // Flash cart icon
        cartIcon.style.transform = 'scale(1.3)';
        cartIcon.style.transition = 'transform 0.2s';
        setTimeout(() => { cartIcon.style.transform = ''; }, 200);
      }, 750);
    }

    await addToCart(variant.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2500);
  };

  const images = product?.images.edges.map(e => e.node) ?? [];
  const variants = product?.variants?.edges.map(e => e.node) ?? [];
  const selectedVariant = getSelectedVariant();
  const price = selectedVariant?.price ?? product?.priceRange.minVariantPrice;
  const available = selectedVariant?.availableForSale ?? true;

  return (
    <>
      <style>{`
        .pm-overlay {
          position: fixed; inset: 0; z-index: 150;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          animation: pmFadeIn 0.25s ease;
        }
        @keyframes pmFadeIn { from{opacity:0} to{opacity:1} }

        .pm-box {
          background: #0f0f0f;
          border: 1px solid rgba(255,59,0,0.2);
          width: 100%; max-width: 900px;
          max-height: 90vh; overflow-y: auto;
          position: relative;
          animation: pmSlideUp 0.35s cubic-bezier(0.23,1,0.32,1);
          scrollbar-width: thin;
          scrollbar-color: rgba(255,59,0,0.3) transparent;
        }
        .pm-box::-webkit-scrollbar { width: 4px; }
        .pm-box::-webkit-scrollbar-thumb { background: rgba(255,59,0,0.3); }
        @keyframes pmSlideUp { from{transform:translateY(32px);opacity:0} to{transform:none;opacity:1} }

        .pm-close {
          position: absolute; top: 16px; right: 16px; z-index: 10;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, color 0.2s;
          font-size: 16px; line-height: 1;
        }
        .pm-close:hover { background: rgba(255,59,0,0.2); color: #fff; border-color: rgba(255,59,0,0.4); }

        .pm-grid { display: grid; grid-template-columns: 1fr 1fr; min-height: 500px; }

        /* Left: Images */
        .pm-images { background: #111; padding: 28px; display: flex; flex-direction: column; gap: 12px; border-right: 1px solid rgba(255,255,255,0.05); }
        .pm-main-img {
          position: relative; aspect-ratio: 1/1; overflow: hidden;
          background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06);
        }
        .pm-main-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pm-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.15); font-size: 13px; }
        .pm-wish {
          position: absolute; top: 12px; right: 12px;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: transform 0.2s, background 0.2s;
          color: rgba(255,255,255,0.5);
        }
        .pm-wish:hover { transform: scale(1.15); }
        .pm-wish--on { color: #ef4444; background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); }
        .pm-thumbs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
        .pm-thumb {
          flex-shrink: 0; width: 60px; height: 60px;
          border: 2px solid transparent; cursor: pointer;
          overflow: hidden; transition: border-color 0.2s;
        }
        .pm-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pm-thumb--on { border-color: #FF3B00; }
        .pm-thumb:hover { border-color: rgba(255,59,0,0.5); }

        /* Right: Info */
        .pm-info { padding: 36px 32px; display: flex; flex-direction: column; gap: 24px; }
        .pm-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; color: #fff; line-height: 1; }
        .pm-price { font-size: 26px; font-weight: 700; color: #FF3B00; }
        .pm-oos { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #FF3B00; border: 1px dashed rgba(255,59,0,0.4); padding: 4px 10px; margin-top: 6px; }

        /* Options */
        .pm-opt-label { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; display: block; }
        .pm-opt-btns { display: flex; flex-wrap: wrap; gap: 8px; }
        .pm-opt-btn {
          padding: 8px 16px; font-size: 12px; font-weight: 600;
          letter-spacing: 1px; border: 1px solid rgba(255,255,255,0.12);
          background: transparent; color: rgba(255,255,255,0.6);
          cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
        }
        .pm-opt-btn:hover { border-color: rgba(255,59,0,0.5); color: #fff; }
        .pm-opt-btn--on { border-color: #FF3B00; background: rgba(255,59,0,0.1); color: #fff; }
        .pm-opt-btn--off { border-color: rgba(255,255,255,0.05); color: rgba(255,255,255,0.2); cursor: not-allowed; text-decoration: line-through; }

        /* Qty */
        .pm-qty { display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.12); width: fit-content; }
        .pm-qty-btn { width: 40px; height: 40px; background: none; border: none; color: rgba(255,255,255,0.6); font-size: 20px; cursor: pointer; transition: color 0.2s, background 0.2s; display: flex; align-items: center; justify-content: center; line-height: 1; }
        .pm-qty-btn:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .pm-qty-num { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #fff; border-left: 1px solid rgba(255,255,255,0.12); border-right: 1px solid rgba(255,255,255,0.12); }

        /* Description */
        .pm-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.8; font-weight: 300; }

        /* CTAs */
        .pm-ctas { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
        .pm-add {
          padding: 16px; width: 100%;
          font-size: 12px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase;
          border: none; cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s; position: relative; overflow: hidden;
        }
        .pm-add--active { background: #FF3B00; color: #fff; }
        .pm-add--active:hover { background: #ff4d1a; transform: translateY(-1px); box-shadow: 0 8px 28px rgba(255,59,0,0.4); }
        .pm-add--active:active { transform: none; }
        .pm-add--done { background: #16a34a; color: #fff; }
        .pm-add--flying { background: rgba(255,59,0,0.4); color: rgba(255,255,255,0.6); cursor: not-allowed; }
        .pm-add--disabled { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.25); cursor: not-allowed; }

        .pm-wish-btn {
          padding: 12px; width: 100%;
          font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
          background: transparent; border: 1px dashed rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.4); cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .pm-wish-btn:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); }
        .pm-wish-btn--on { border-color: rgba(239,68,68,0.4); color: #ef4444; background: rgba(239,68,68,0.06); }

        /* Loading */
        .pm-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 16px; }
        .pm-spinner { width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.08); border-top-color: #FF3B00; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .pm-spin-text { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.25); font-family: 'Inter', sans-serif; }

        @media (max-width: 700px) {
          .pm-grid { grid-template-columns: 1fr; }
          .pm-images { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); padding: 20px; }
          .pm-info { padding: 24px 20px; }
          .pm-title { font-size: 28px; }
        }
      `}</style>

      <div className="pm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="pm-box">
          <button className="pm-close" onClick={onClose}>✕</button>

          {loading ? (
            <div className="pm-loading">
              <div className="pm-spinner" />
              <span className="pm-spin-text">Loading</span>
            </div>
          ) : !product ? (
            <div className="pm-loading">
              <span className="pm-spin-text">Product not found</span>
            </div>
          ) : (
            <div className="pm-grid">
              {/* Images */}
              <div className="pm-images">
                <div className="pm-main-img">
                  {images.length > 0
                    ? <img ref={imgRef} src={images[selectedImage]?.url} alt={images[selectedImage]?.altText || product.title} />
                    : <div className="pm-no-img">No image</div>
                  }
                  <button
                    className={`pm-wish ${wishlisted ? 'pm-wish--on' : ''}`}
                    onClick={() => setWishlisted(w => !w)}
                    aria-label="Wishlist"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
                {images.length > 1 && (
                  <div className="pm-thumbs">
                    {images.map((img, idx) => (
                      <button key={idx} className={`pm-thumb ${selectedImage === idx ? 'pm-thumb--on' : ''}`} onClick={() => setSelectedImage(idx)}>
                        <img src={img.url} alt={img.altText || `View ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="pm-info">
                <div>
                  <h2 className="pm-title">{product.title}</h2>
                  {price && <p className="pm-price">{formatPrice(price.amount, price.currencyCode)}</p>}
                  {!available && <span className="pm-oos">Out of Stock</span>}
                </div>

                {/* Options */}
                {product.options?.filter(o => o.values.length > 1).map(opt => (
                  <div key={opt.name}>
                    <span className="pm-opt-label">{opt.name}</span>
                    <div className="pm-opt-btns">
                      {opt.values.map(val => {
                        const isOn = selectedOptions[opt.name] === val;
                        const testOpts = { ...selectedOptions, [opt.name]: val };
                        const match = variants.find(v => v.selectedOptions.every(o => testOpts[o.name] === o.value));
                        const avail = match?.availableForSale ?? false;
                        return (
                          <button
                            key={val}
                            className={`pm-opt-btn ${isOn ? 'pm-opt-btn--on' : ''} ${!avail ? 'pm-opt-btn--off' : ''}`}
                            onClick={() => avail && setSelectedOptions(p => ({ ...p, [opt.name]: val }))}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div>
                  <span className="pm-opt-label">Quantity</span>
                  <div className="pm-qty">
                    <button className="pm-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                    <span className="pm-qty-num">{quantity}</span>
                    <button className="pm-qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <p className="pm-desc">{product.description}</p>
                )}

                {/* CTAs */}
                <div className="pm-ctas">
                  <button
                    className={`pm-add ${
                      addedFeedback ? 'pm-add--done'
                      : flying || cartLoading ? 'pm-add--flying'
                      : !available || !selectedVariant ? 'pm-add--disabled'
                      : 'pm-add--active'
                    }`}
                    onClick={handleAddToCart}
                    disabled={!available || !selectedVariant || cartLoading || flying}
                  >
                    {addedFeedback ? '✓ ADDED TO CART'
                      : flying || cartLoading ? 'ADDING...'
                      : !available ? 'OUT OF STOCK'
                      : !selectedVariant ? 'SELECT OPTIONS'
                      : 'ADD TO CART'}
                  </button>

                  <button
                    className={`pm-wish-btn ${wishlisted ? 'pm-wish-btn--on' : ''}`}
                    onClick={() => setWishlisted(w => !w)}
                  >
                    {wishlisted ? '♥ WISHLISTED' : '♡ ADD TO WISHLIST'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}