import { useCart } from '../CartContext';

export default function CartButton() {
  const { openCart, totalItems, loading } = useCart();

  return (
    <button
      onClick={openCart}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-black text-white rounded-full shadow-xl flex items-center justify-center hover:bg-gray-800 active:scale-95 transition-all"
      aria-label={`Cart${totalItems > 0 ? ` (${totalItems} items)` : ''}`}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </>
      )}
    </button>
  );
}
