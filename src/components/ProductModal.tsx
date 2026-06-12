import { useState, useEffect, useCallback } from 'react';
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
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const getSelectedVariant = useCallback((): Variant | null => {
    if (!product?.variants) return null;
    return product.variants.edges.find(({ node }) =>
      node.selectedOptions.every(opt => selectedOptions[opt.name] === opt.value)
    )?.node ?? null;
  }, [product, selectedOptions]);

  const handleAddToCart = async () => {
    const variant = getSelectedVariant();
    if (!variant) return;
    await addToCart(variant.id, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const images = product?.images.edges.map(e => e.node) ?? [];
  const variants = product?.variants?.edges.map(e => e.node) ?? [];
  const selectedVariant = getSelectedVariant();
  const price = selectedVariant?.price ?? product?.priceRange.minVariantPrice;
  const available = selectedVariant?.availableForSale ?? true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
              <span className="text-sm">Loading product…</span>
            </div>
          </div>
        ) : !product ? (
          <div className="flex items-center justify-center h-96 text-gray-400 text-sm">
            Product not found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Images */}
            <div className="p-6 flex flex-col gap-4 bg-gray-50 rounded-tl-2xl rounded-bl-2xl md:rounded-tr-none rounded-tr-2xl">
              <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]?.url}
                    alt={images[selectedImage]?.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
                )}
                <button
                  onClick={() => setWishlisted(w => !w)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                  aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlisted ? '#ef4444' : 'none'} stroke={wishlisted ? '#ef4444' : '#6b7280'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-black' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img.url} alt={img.altText || `View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="p-8 flex flex-col justify-between">
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">{product.title}</h2>
                  {price && (
                    <p className="text-xl font-semibold text-gray-800 mt-1">
                      {formatPrice(price.amount, price.currencyCode)}
                    </p>
                  )}
                  {!available && (
                    <span className="inline-block mt-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Out of stock
                    </span>
                  )}
                </div>

                {/* Options */}
                {product.options?.filter(o => o.values.length > 1).map(option => (
                  <div key={option.name}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">{option.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map(value => {
                        const isSelected = selectedOptions[option.name] === value;
                        const testOptions = { ...selectedOptions, [option.name]: value };
                        const matchingVariant = variants.find(v =>
                          v.selectedOptions.every(o => testOptions[o.name] === o.value)
                        );
                        const isAvailable = matchingVariant?.availableForSale ?? false;
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [option.name]: value }))}
                            disabled={!isAvailable}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSelected
                                ? 'border-black bg-black text-white'
                                : isAvailable
                                  ? 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                                  : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
                  <div className="flex items-center border border-gray-200 rounded-lg w-fit overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg">−</button>
                    <span className="w-10 h-10 flex items-center justify-center text-gray-900 font-medium text-sm border-x border-gray-200">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-lg">+</button>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Details</p>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-4">{product.description}</p>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!available || !selectedVariant || cartLoading}
                  className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    addedFeedback
                      ? 'bg-green-600 text-white'
                      : available && selectedVariant
                        ? 'bg-black text-white hover:bg-gray-800 active:scale-[0.99]'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {cartLoading ? 'Adding…' : addedFeedback ? '✓ Added to cart' : !available ? 'Out of Stock' : !selectedVariant ? 'Select options' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => setWishlisted(w => !w)}
                  className={`w-full py-3 rounded-xl text-sm font-medium border transition-all ${
                    wishlisted
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {wishlisted ? '♥ Wishlisted' : '♡ Add to Wishlist'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
