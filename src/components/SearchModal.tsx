import { useState, useEffect, useRef } from 'react';
import { shopifyFetch, formatPrice } from '../shopify';
import type { Product } from '../shopify';

const SEARCH_QUERY = `
  query searchProducts($query: String!) {
    products(first: 12, query: $query) {
      edges {
        node {
          id title handle description
          images(first: 1) { edges { node { url altText } } }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

interface SearchModalProps {
  onClose: () => void;
  onProductClick: (handle: string) => void;
}

export default function SearchModal({ onClose, onProductClick }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus input
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await shopifyFetch({ query: SEARCH_QUERY, variables: { query: query.trim() } });
        const products = res?.data?.products?.edges?.map((e: { node: Product }) => e.node) ?? [];
        setResults(products);
        setSearched(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (handle: string) => {
    onClose();
    onProductClick(handle);
  };

  return (
    <>
      <style>{`
        .sm-overlay {
          position: fixed; inset: 0; z-index: 160;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(16px);
          display: flex; flex-direction: column;
          animation: smIn 0.2s ease;
        }
        @keyframes smIn { from{opacity:0} to{opacity:1} }

        .sm-header {
          padding: 28px 48px 0;
          border-bottom: 1px solid rgba(255,59,0,0.15);
          flex-shrink: 0;
        }

        .sm-top {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px;
        }
        .sm-label {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 13px; letter-spacing: 5px; color: rgba(255,59,0,0.7);
        }
        .sm-close {
          background: none; border: 1px dashed rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.4); padding: 8px 16px;
          font-size: 11px; font-weight: 700; letter-spacing: 2px;
          text-transform: uppercase; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: all 0.2s;
        }
        .sm-close:hover { color: #fff; border-color: rgba(255,255,255,0.4); }

        .sm-input-wrap {
          display: flex; align-items: center; gap: 16px;
          padding-bottom: 24px;
        }
        .sm-search-icon { color: rgba(255,59,0,0.6); flex-shrink: 0; }
        .sm-input {
          flex: 1; background: none; border: none; outline: none;
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 72px);
          letter-spacing: 3px; color: #fff;
          caret-color: #FF3B00;
        }
        .sm-input::placeholder { color: rgba(255,255,255,0.12); }

        .sm-body {
          flex: 1; overflow-y: auto; padding: 32px 48px;
          scrollbar-width: thin; scrollbar-color: rgba(255,59,0,0.2) transparent;
        }
        .sm-body::-webkit-scrollbar { width: 3px; }
        .sm-body::-webkit-scrollbar-thumb { background: rgba(255,59,0,0.3); }

        /* Loading */
        .sm-loading {
          display: flex; align-items: center; gap: 12px;
          color: rgba(255,255,255,0.3); font-size: 12px;
          letter-spacing: 3px; text-transform: uppercase;
          font-family: 'Inter', sans-serif;
        }
        .sm-spinner {
          width: 16px; height: 16px;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-top-color: #FF3B00; border-radius: 50%;
          animation: spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Empty */
        .sm-empty {
          font-size: 14px; color: rgba(255,255,255,0.25);
          font-family: 'Inter', sans-serif;
        }
        .sm-empty strong { color: rgba(255,255,255,0.5); }

        /* Suggestions */
        .sm-suggestions {
          display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 40px;
        }
        .sm-suggest-label {
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
          width: 100%; margin-bottom: 4px;
          font-family: 'Inter', sans-serif;
        }
        .sm-chip {
          padding: 8px 16px; background: none;
          border: 1px dashed rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.4); font-size: 12px;
          font-weight: 600; letter-spacing: 1px;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: all 0.2s;
        }
        .sm-chip:hover { border-color: rgba(255,59,0,0.5); color: #FF3B00; }

        /* Results grid */
        .sm-results-header {
          font-size: 10px; font-weight: 700; letter-spacing: 3px;
          text-transform: uppercase; color: rgba(255,255,255,0.25);
          margin-bottom: 20px; font-family: 'Inter', sans-serif;
        }
        .sm-results-header span { color: #FF3B00; }
        .sm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2px;
        }
        .sm-card {
          background: #0f0f0f; border: 1px solid rgba(255,255,255,0.04);
          cursor: pointer; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
          animation: smCardIn 0.3s ease both;
        }
        @keyframes smCardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .sm-card:hover { border-color: rgba(255,59,0,0.3); transform: translateY(-2px); }
        .sm-card-img {
          aspect-ratio: 1/1; overflow: hidden; background: #111;
          position: relative;
        }
        .sm-card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.4s; }
        .sm-card:hover .sm-card-img img { transform: scale(1.05); }
        .sm-card-info { padding: 14px 12px; }
        .sm-card-name { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sm-card-price { font-size: 12px; font-weight: 700; color: rgba(255,59,0,0.8); }

        @media (max-width: 600px) {
          .sm-header { padding: 20px 20px 0; }
          .sm-body { padding: 24px 20px; }
          .sm-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="sm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sm-header">
          <div className="sm-top">
            <span className="sm-label">SEARCH</span>
            <button className="sm-close" onClick={onClose}>ESC ✕</button>
          </div>
          <div className="sm-input-wrap">
            <svg className="sm-search-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              className="sm-input"
              placeholder="SEARCH PRODUCTS..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="sm-body">
          {loading && (
            <div className="sm-loading">
              <div className="sm-spinner" />
              Searching...
            </div>
          )}

          {!query && !loading && (
            <div className="sm-suggestions">
              <span className="sm-suggest-label">Popular searches</span>
              {['Running', 'Training', 'Lifestyle', 'Footwear', 'SS26'].map(t => (
                <button key={t} className="sm-chip" onClick={() => setQuery(t)}>{t}</button>
              ))}
            </div>
          )}

          {searched && !loading && results.length === 0 && (
            <p className="sm-empty">No results for <strong>"{query}"</strong> — try a different term.</p>
          )}

          {results.length > 0 && !loading && (
            <>
              <p className="sm-results-header">
                <span>{results.length}</span> result{results.length !== 1 ? 's' : ''} for "{query}"
              </p>
              <div className="sm-grid">
                {results.map((p, i) => {
                  const img = p.images.edges[0]?.node;
                  const price = p.priceRange.minVariantPrice;
                  return (
                    <div
                      key={p.id}
                      className="sm-card"
                      style={{ animationDelay: `${i * 50}ms` }}
                      onClick={() => handleSelect(p.handle)}
                    >
                      <div className="sm-card-img">
                        {img
                          ? <img src={img.url} alt={img.altText || p.title} loading="lazy" />
                          : <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />
                        }
                      </div>
                      <div className="sm-card-info">
                        <p className="sm-card-name">{p.title}</p>
                        <p className="sm-card-price">{formatPrice(price.amount, price.currencyCode)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}