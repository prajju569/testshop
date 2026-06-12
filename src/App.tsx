import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { shopifyFetch, PRODUCTS_QUERY, formatPrice } from './shopify';
import type { Product } from './shopify';
import { useCart } from './CartContext';
import CartModal from './components/CartModal';
import ShoeRotator from './components/ShoeRotator';
import CartPage from './pages/CartPage';
import SearchModal from './components/SearchModal';

const ProductModal = lazy(() => import('./components/ProductModal'));

/* ── Custom Cursor ── */
function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId: number;
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // Dot follows instantly — no lag at all
      if (dotRef.current) {
        dotRef.current.style.left = `${mx - 4}px`;
        dotRef.current.style.top = `${my - 4}px`;
      }
    };
    document.addEventListener('mousemove', move, { passive: true });
    const loop = () => {
      // Ring follows with slight smooth lag
      rx += (mx - rx) * 0.22;
      ry += (my - ry) * 0.22;
      if (ringRef.current) {
        ringRef.current.style.left = `${rx - 18}px`;
        ringRef.current.style.top = `${ry - 18}px`;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    const addHover = (el: Element) => {
      el.addEventListener('mouseenter', () => ringRef.current?.classList.add('cursor-ring--hover'));
      el.addEventListener('mouseleave', () => ringRef.current?.classList.remove('cursor-ring--hover'));
    };
    document.querySelectorAll('a,button,input,[data-hover]').forEach(addHover);
    // Re-scan after mount for dynamically added elements
    const observer = new MutationObserver(() => {
      document.querySelectorAll('a,button,input,[data-hover]').forEach(addHover);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('mousemove', move);
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);
  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}

/* ── Marquee ── */
function Marquee({ inverted }: { inverted?: boolean }) {
  const items = ['FREE DELIVERY OVER ₹2000', 'NEW SEASON DROP', 'LOTTO ATHLETIC', 'BUILT TO MOVE', 'PRECISION ENGINEERED', 'LIMITED RUNS'];
  const repeated = [...items, ...items, ...items, ...items];
  return (
    <div className={`marquee-wrap ${inverted ? 'marquee-wrap--inv' : ''}`}>
      <div className="marquee-track">
        {repeated.map((item, i) => (
          <span key={i} className="marquee-item">{item}<span className="marquee-sep"> ✦ </span></span>
        ))}
      </div>
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close on ESC
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  const handleNavClick = (id: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 400);
      }
    }, menuOpen ? 500 : 0);
  };

  const NAV_ITEMS = [
    { label: 'Collections', id: 'collections' },
    { label: 'Shop', id: 'products' },
    { label: 'Story', id: 'story' },
  ];

  return (
    <>
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>LOTTO</a>

          {/* Desktop links */}
          <ul className="nav-links">
            {NAV_ITEMS.map(item => (
              <li key={item.id}>
                <button className="nav-link-btn" onClick={() => handleNavClick(item.id)}>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="nav-actions">
            <button className="nav-search" onClick={onSearchOpen} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <button className="nav-cart" onClick={() => navigate('/cart')} aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {totalItems > 0 && <span className="nav-badge">{totalItems}</span>}
            </button>

            {/* Hamburger — mobile only */}
            <button
              className={`nav-hamburger ${menuOpen ? 'nav-hamburger--open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="hb-line hb-line--1" />
              <span className="hb-line hb-line--2" />
              <span className="hb-line hb-line--3" />
            </button>
          </div>
        </div>
      </nav>

      {/* Full screen mobile menu */}
      <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
        {/* Background noise texture */}
        <div className="mm-bg" />

        {/* Corner frame */}
        <div className="mm-corner mm-corner--tl" />
        <div className="mm-corner mm-corner--tr" />
        <div className="mm-corner mm-corner--bl" />
        <div className="mm-corner mm-corner--br" />

        {/* Nav items */}
        <ul className="mm-links">
          {NAV_ITEMS.map((item, i) => (
            <li
              key={item.id}
              className="mm-item"
              style={{ transitionDelay: menuOpen ? `${i * 80 + 100}ms` : '0ms' }}
            >
              <button
                className="mm-link"
                onClick={() => handleNavClick(item.id)}
              >
                <span className="mm-link-num">0{i + 1}</span>
                <span className="mm-link-text">{item.label}</span>
                <span className="mm-link-arrow">→</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Bottom bar */}
        <div className="mm-bottom">
          <div className="mm-bottom-actions">
            <button className="mm-icon-btn" onClick={() => { setMenuOpen(false); onSearchOpen(); }} aria-label="Search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <span>Search</span>
            </button>
            <button className="mm-icon-btn" onClick={() => { setMenuOpen(false); navigate('/cart'); }} aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Cart {totalItems > 0 && `(${totalItems})`}</span>
            </button>
          </div>
          <span className="mm-tagline">LOTTO ATHLETIC — SS 2026</span>
        </div>
      </div>
    </>
  );
}

/* ── Hero (scroll-driven) ── */
function Hero({ onShopClick }: { onShopClick: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const c1 = useRef<HTMLDivElement>(null);
  const c2 = useRef<HTMLDivElement>(null);
  const c3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const onScroll = () => {
      if (!sectionRef.current) return;
      const sy = window.scrollY;
      const heroH = sectionRef.current.offsetHeight - window.innerHeight;
      const p = clamp(sy / heroH, 0, 1);
      const p1 = clamp(p / 0.35, 0, 1);
      const p2 = clamp((p - 0.35) / 0.3, 0, 1);
      const p3 = clamp((p - 0.65) / 0.35, 0, 1);

      if (titleRef.current) {
        titleRef.current.style.opacity = String(Math.max(0, 1 - p1 * 2.5));
        titleRef.current.style.transform = `translate(-50%,calc(-50% - ${p1 * 60}px))`;
      }
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - p1 * 5));

      const scale = lerp(0.1, 1.2, p1) - lerp(0, 0.3, p2);
      if (logoRef.current) {
        logoRef.current.style.opacity = p1 > 0 ? String(Math.min(1, p1 * 3)) : '0';
        logoRef.current.style.transform = `translate(-50%,-50%) scale(${Math.max(0.05, scale)})`;
      }

      if (stackRef.current) {
        if (p3 > 0) {
          if (logoRef.current) logoRef.current.style.opacity = String(Math.max(0, 1 - p3 * 2.5));
          stackRef.current.style.opacity = String(p3);
          if (c1.current) { c1.current.style.opacity = String(p3); c1.current.style.transform = `scale(${lerp(0.85,1,p3)}) translateX(${p3*120}px) rotate(${p3*14}deg)`; }
          if (c2.current) { c2.current.style.opacity = String(p3 * 0.9); c2.current.style.transform = `scale(0.92) translateX(0) rotate(${p3*1.5}deg)`; }
          if (c3.current) { c3.current.style.opacity = String(p3 * 0.75); c3.current.style.transform = `scale(${lerp(0.85,0.95,p3)}) translateX(${-p3*100}px) rotate(${-p3*12}deg)`; }
        } else {
          stackRef.current.style.opacity = '0';
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section ref={sectionRef} className="hero" id="hero">
      <div className="hero-sticky">
        {/* Frame corners */}
        <div className="frame-corner frame-corner--tl" />
        <div className="frame-corner frame-corner--tr" />
        <div className="frame-corner frame-corner--bl" />
        <div className="frame-corner frame-corner--br" />

        {/* Headline */}
        <div ref={titleRef} className="hero-title">
          <p className="hero-eye">SS 2026 — Performance Collection</p>
          <h1 className="hero-h1">
            <span className="hero-outline">MOVE</span>
            <span className="hero-solid">WITH</span>
            <span className="hero-outline">PURPOSE</span>
          </h1>
          <p className="hero-sub">Premium athletic wear. Built for the relentless.</p>
          <div className="hero-ctas">
            <button className="btn-red" onClick={onShopClick}>Shop Now</button>
            <button className="btn-ghost" onClick={onShopClick}>Lookbook →</button>
          </div>
        </div>

        {/* Logo zoom */}
        <div ref={logoRef} className="hero-logo-zoom">
          <span>LOTTO</span>
        </div>

        {/* Card fan */}
        <div ref={stackRef} className="card-stack">
          <div ref={c3} className="stack-card stack-card--3">
            <div className="stack-card-inner">
              <span className="stack-label">TRAINING</span>
              <p className="stack-quote">No days off.</p>
              <span className="stack-tag">SS26</span>
            </div>
          </div>
          <div ref={c2} className="stack-card stack-card--2">
            <div className="stack-card-inner">
              <span className="stack-label">RUNNING</span>
              <p className="stack-quote">Every mile counts.</p>
              <span className="stack-tag">SS26</span>
            </div>
          </div>
          <div ref={c1} className="stack-card stack-card--1">
            <div className="stack-card-inner">
              <span className="stack-label">LIFESTYLE</span>
              <p className="stack-quote">Move without limits.</p>
              <span className="stack-tag">SS26</span>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div ref={hintRef} className="scroll-hint">
          <div className="scroll-line" />
          <span>Scroll</span>
        </div>
      </div>
    </section>
  );
}

/* ── Collections ── */
const COLS = [
  { name: 'Training', tag: 'High Performance', num: '01', accent: '#FF3B00' },
  { name: 'Running', tag: 'Lightweight Series', num: '02', accent: '#fff' },
  { name: 'Lifestyle', tag: 'Street Ready', num: '03', accent: '#FF3B00' },
  { name: 'Footwear', tag: 'Ground Control', num: '04', accent: '#fff' },
];

function Collections() {
  const scrollToProducts = () => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  return (
    <section className="section" id="collections">
      <div className="section-head reveal">
        <span className="eye">Browse by Category</span>
        <h2 className="sec-title">COLLECTIONS</h2>
      </div>
      <div className="cols-grid">
        {COLS.map((c, i) => (
          <div key={c.name} className={`col-card reveal ${i === 0 ? 'col-card--wide' : ''}`} data-hover="true" onClick={scrollToProducts}>
            <span className="col-tag">{c.tag}</span>
            <div className="col-bottom">
              <h3 className="col-name">{c.name}</h3>
              <button className="col-cta" style={{ color: c.accent }}>Explore →</button>
            </div>
            <span className="col-num">{c.num}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Products ── */
function Products({ products, onProductClick }: { products: Product[]; onProductClick: (h: string) => void }) {
  return (
    <section className="section" id="products">
      <div className="section-head reveal">
        <span className="eye">Latest Drops</span>
        <h2 className="sec-title">NEW ARRIVALS</h2>
      </div>
      {products.length === 0 ? (
        <div className="empty reveal">Add products in Shopify Admin to see them here.</div>
      ) : (
        <div className="prods-grid">
          {products.map((p, i) => {
            const img = p.images.edges[0]?.node;
            const price = p.priceRange.minVariantPrice;
            return (
              <div key={p.id} className="prod-card reveal" onClick={() => onProductClick(p.handle)} data-hover="true">
                <div className="prod-img">
                  {img ? <img src={img.url} alt={img.altText || p.title} loading="lazy" /> : <div className="prod-no-img">No Image</div>}
                <div className="prod-overlay">
                    <span>VIEW PRODUCT</span>
                  </div>
                  {i === 0 && <span className="prod-badge">NEW</span>}
                </div>
                <div className="prod-info">
                  <h3 className="prod-name">{p.title}</h3>
                  <p className="prod-price">{formatPrice(price.amount, price.currencyCode)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── Story ── */
function Story() {
  return (
    <section className="story" id="story">
      <div className="story-inner">
        <div className="story-left reveal">
          <span className="eye">Our Story</span>
          <h2 className="story-title">BUILT FOR<br/>THE RELENTLESS</h2>
          <p className="story-body">LOTTO was built from one belief — elite performance gear shouldn't choose between function and identity. Every stitch, every fabric choice, every silhouette is engineered for people who refuse to treat movement as an afterthought.</p>
          <p className="story-body">We don't make gear for the gym. We make gear for the mindset.</p>
          <button className="btn-red" style={{ marginTop: '32px' }} onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}>Our Manifesto</button>
        </div>
        <div className="story-right reveal">
          <div className="stats-grid">
            {[['2020', 'Founded'], ['50K+', 'Athletes'], ['18', 'Countries'], ['100%', 'Premium']].map(([v, l]) => (
              <div key={l} className="stat-box">
                <span className="stat-val">{v}</span>
                <span className="stat-lbl">{l}</span>
              </div>
            ))}
          </div>
          <div className="story-quote reveal">
            <p>"The difference between good and elite is usually found in the details you can't see."</p>
            <span>— LOTTO Design Studio</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ── */
const REVIEWS = [
  { q: "Best training kit I've owned. The fit is like a second skin.", n: 'Arjun M.', r: 'Marathon Runner, Mumbai' },
  { q: "Finally — performance and aesthetics in the same piece.", n: 'Priya S.', r: 'CrossFit Athlete, Bengaluru' },
  { q: "Wore LOTTO for a 6-hour trail. Felt nothing but comfort.", n: 'Rahul K.', r: 'Ultra Runner, Pune' },
];

function Testimonials() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % REVIEWS.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="testi">
      <div className="testi-inner reveal">
        <span className="eye" style={{ textAlign: 'center', display: 'block' }}>What Athletes Say</span>
        <div className="testi-card">
          <div className="testi-stars">★★★★★</div>
          <blockquote className="testi-q">"{REVIEWS[active].q}"</blockquote>
          <div className="testi-author">
            <span className="testi-name">{REVIEWS[active].n}</span>
            <span className="testi-role">{REVIEWS[active].r}</span>
          </div>
          <div className="testi-dots">
            {REVIEWS.map((_, i) => (
              <button key={i} className={`tdot ${i === active ? 'tdot--on' : ''}`} onClick={() => setActive(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Newsletter ── */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  return (
    <section className="nl">
      <div className="nl-inner reveal">
        <span className="eye" style={{ color: 'rgba(0,0,0,0.45)' }}>Stay Ahead</span>
        <h2 className="nl-title">EARLY ACCESS<br/>TO EVERY DROP</h2>
        <p className="nl-sub">Join 50,000+ athletes. Zero spam. Only fire releases.</p>
        {done ? (
          <p className="nl-done">✦ You're in. Watch your inbox.</p>
        ) : (
          <div className="nl-form">
            <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} className="nl-input" />
            <button className="btn-dark" onClick={() => { if (email) setDone(true); }}>Subscribe</button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <span className="footer-logo">LOTTO</span>
        <div className="footer-links">
        <div className="footer-links">
            {[
              { label: 'Privacy', href: 'https://www.shopify.com/legal/privacy' },
              { label: 'Terms', href: 'https://www.shopify.com/legal/terms' },
              { label: 'Contact', href: 'mailto:hello@lotto.com' },
              { label: 'Returns', href: '#' },
              { label: 'Shipping', href: '#' },
            ].map(l => (
              <a key={l.label} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{l.label}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 LOTTO Athletic. All rights reserved.</span>
        <span>Made for those who move.</span>
      </div>
    </footer>
  );
}

const CSS = `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080808; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; cursor: none; }
        body::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:1; background-image: repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,59,0,0.015) 40px,rgba(255,59,0,0.015) 41px), repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,59,0,0.015) 40px,rgba(255,59,0,0.015) 41px); }

        /* Cursor */
        .cursor-dot { position:fixed; width:8px; height:8px; background:#FF3B00; border-radius:50%; pointer-events:none; z-index:9999; left:0; top:0; }
        .cursor-ring { position:fixed; width:36px; height:36px; border:1.5px solid rgba(255,59,0,0.6); border-radius:50%; pointer-events:none; z-index:9998; left:0; top:0; transition:width 0.25s,height 0.25s,border-color 0.25s,border-style 0.25s; }
        .cursor-ring--hover { width:52px; height:52px; border-color:#FF3B00; border-style:dashed; }

        /* Navbar */
        .nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:0 48px; transition:background 0.3s; }
        .nav--scrolled { background:rgba(8,8,8,0.94); backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,59,0,0.12); }
        .nav-inner { max-width:1400px; margin:0 auto; height:72px; display:flex; align-items:center; justify-content:space-between; }
        .nav-logo { font-family:'Bebas Neue',sans-serif; font-size:30px; letter-spacing:6px; color:#fff; text-decoration:none; }
        .nav-links { display:flex; gap:40px; list-style:none; }
        .nav-links a, .nav-link-btn { color:rgba(255,255,255,0.5); text-decoration:none; font-size:12px; font-weight:500; letter-spacing:2px; text-transform:uppercase; transition:color 0.2s; background:none; border:none; cursor:pointer; font-family:'Inter',sans-serif; padding:0; }
        .nav-links a:hover, .nav-link-btn:hover { color:#fff; }
        .nav-actions { display:flex; align-items:center; gap:8px; }
        .nav-search { background:none; border:1px dashed rgba(255,255,255,0.2); color:#fff; cursor:pointer; display:flex; align-items:center; padding:10px; transition:border-color 0.2s,background 0.2s; }
        .nav-search:hover { border-color:rgba(255,59,0,0.6); background:rgba(255,59,0,0.06); }
        .nav-cart { background:none; border:1px dashed rgba(255,255,255,0.2); color:#fff; cursor:pointer; position:relative; display:flex; align-items:center; padding:10px; transition:border-color 0.2s; }
        .nav-cart:hover { border-color:rgba(255,59,0,0.6); }
        .nav-badge { position:absolute; top:-6px; right:-6px; background:#FF3B00; color:#fff; font-size:9px; font-weight:700; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; }

        /* ── Hamburger ── */
        .nav-hamburger { display:none; flex-direction:column; justify-content:center; align-items:center; gap:5px; width:40px; height:40px; background:none; border:1px dashed rgba(255,255,255,0.2); cursor:pointer; padding:0; position:relative; z-index:201; transition:border-color 0.3s; }
        .nav-hamburger:hover { border-color:rgba(255,59,0,0.5); }
        .hb-line { display:block; width:18px; height:1.5px; background:#fff; border-radius:1px; transition:transform 0.35s cubic-bezier(0.23,1,0.32,1),opacity 0.2s,width 0.3s; transform-origin:center; }
        .nav-hamburger--open { border-color:rgba(255,59,0,0.5); }
        .nav-hamburger--open .hb-line--1 { transform:translateY(6.5px) rotate(45deg); }
        .nav-hamburger--open .hb-line--2 { opacity:0; width:0; }
        .nav-hamburger--open .hb-line--3 { transform:translateY(-6.5px) rotate(-45deg); }

        /* ── Full screen mobile menu ── */
        .mobile-menu { position:fixed; inset:0; z-index:199; background:#080808; display:flex; flex-direction:column; justify-content:center; padding:100px 40px 48px; transform:translateX(100%); transition:transform 0.5s cubic-bezier(0.23,1,0.32,1); overflow:hidden; }
        .mobile-menu--open { transform:translateX(0); }
        .mm-bg { position:absolute; inset:0; pointer-events:none; background-image:repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,59,0,0.02) 40px,rgba(255,59,0,0.02) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,59,0,0.02) 40px,rgba(255,59,0,0.02) 41px); }
        .mm-corner { position:absolute; width:32px; height:32px; z-index:1; }
        .mm-corner--tl { top:14px; left:14px; border-top:1px solid rgba(255,59,0,0.3); border-left:1px solid rgba(255,59,0,0.3); }
        .mm-corner--tr { top:14px; right:14px; border-top:1px solid rgba(255,59,0,0.3); border-right:1px solid rgba(255,59,0,0.3); }
        .mm-corner--bl { bottom:14px; left:14px; border-bottom:1px solid rgba(255,59,0,0.3); border-left:1px solid rgba(255,59,0,0.3); }
        .mm-corner--br { bottom:14px; right:14px; border-bottom:1px solid rgba(255,59,0,0.3); border-right:1px solid rgba(255,59,0,0.3); }
        .mm-links { list-style:none; display:flex; flex-direction:column; gap:2px; position:relative; z-index:2; }
        .mm-item { opacity:0; transform:translateX(32px); transition:opacity 0.45s ease,transform 0.45s cubic-bezier(0.23,1,0.32,1); border-bottom:1px dashed rgba(255,255,255,0.06); }
        .mm-item:first-child { border-top:1px dashed rgba(255,255,255,0.06); }
        .mobile-menu--open .mm-item { opacity:1; transform:none; }
        .mm-link { display:flex; align-items:center; gap:16px; padding:20px 0; width:100%; background:none; border:none; cursor:pointer; text-align:left; transition:padding-left 0.25s; }
        .mm-link:hover { padding-left:10px; }
        .mm-link-num { font-size:10px; font-weight:700; letter-spacing:2px; color:rgba(255,59,0,0.5); font-family:'Inter',sans-serif; width:24px; flex-shrink:0; }
        .mm-link-text { font-family:'Bebas Neue',sans-serif; font-size:clamp(44px,12vw,72px); letter-spacing:3px; color:#fff; line-height:1; flex:1; transition:color 0.2s; }
        .mm-link:hover .mm-link-text { color:#FF3B00; }
        .mm-link-arrow { font-size:24px; color:rgba(255,59,0,0); transition:color 0.2s,transform 0.2s; transform:translateX(-8px); }
        .mm-link:hover .mm-link-arrow { color:#FF3B00; transform:translateX(0); }
        .mm-bottom { position:absolute; bottom:32px; left:40px; right:40px; display:flex; align-items:center; justify-content:space-between; z-index:2; opacity:0; transition:opacity 0.4s 0.35s; }
        .mobile-menu--open .mm-bottom { opacity:1; }
        .mm-bottom-actions { display:flex; gap:10px; }
        .mm-icon-btn { display:flex; align-items:center; gap:8px; background:none; border:1px dashed rgba(255,255,255,0.15); color:rgba(255,255,255,0.45); padding:10px 14px; font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; cursor:pointer; font-family:'Inter',sans-serif; transition:all 0.2s; }
        .mm-icon-btn:hover { border-color:rgba(255,59,0,0.4); color:#FF3B00; }
        .mm-tagline { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.15); font-family:'Inter',sans-serif; }

        /* Show hamburger on mobile, hide desktop nav links */
        @media(max-width:768px) {
          .nav-hamburger { display:flex; }
          .nav-links { display:none; }
          .nav-search { display:none; }
        }

        /* Marquee */
        .marquee-wrap { overflow:hidden; background:#080808; padding:13px 0; border-top:1px dashed rgba(255,59,0,0.25); border-bottom:1px dashed rgba(255,59,0,0.25); }
        .marquee-wrap--inv { background:#FF3B00; border-color:rgba(0,0,0,0.15); }
        .marquee-track { display:flex; width:max-content; animation:mq 28s linear infinite; }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-item { white-space:nowrap; padding:0 0; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; }
        .marquee-wrap--inv .marquee-item { color:#000; }
        .marquee-sep { color:rgba(255,59,0,0.7); padding:0 16px; }
        .marquee-wrap--inv .marquee-sep { color:rgba(0,0,0,0.35); }

        /* Hero */
        .hero { height:550vh; position:relative; }
        .hero-sticky { position:sticky; top:0; height:100vh; width:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#080808; }
        .hero-sticky::after { content:''; position:absolute; inset:20px; border:1px dashed rgba(255,59,0,0.18); pointer-events:none; z-index:2; }

        /* Frame corners */
        .frame-corner { position:absolute; width:40px; height:40px; z-index:3; }
        .frame-corner--tl { top:12px; left:12px; border-top:2px solid #FF3B00; border-left:2px solid #FF3B00; }
        .frame-corner--tr { top:12px; right:12px; border-top:2px solid #FF3B00; border-right:2px solid #FF3B00; }
        .frame-corner--bl { bottom:12px; left:12px; border-bottom:2px solid #FF3B00; border-left:2px solid #FF3B00; }
        .frame-corner--br { bottom:12px; right:12px; border-bottom:2px solid #FF3B00; border-right:2px solid #FF3B00; }

        /* Hero title */
        .hero-title { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; z-index:5; width:100%; padding:0 24px; pointer-events:none; will-change:transform,opacity; }
        .hero-eye { font-size:11px; font-weight:600; letter-spacing:4px; text-transform:uppercase; color:#FF3B00; margin-bottom:24px; display:block; }
        .hero-h1 { font-family:'Bebas Neue',sans-serif; font-size:clamp(72px,13vw,180px); line-height:0.88; letter-spacing:-1px; display:flex; flex-direction:column; gap:2px; margin-bottom:28px; }
        .hero-solid { color:#fff; }
        .hero-outline { color:transparent; -webkit-text-stroke:1.5px rgba(255,255,255,0.2); }
        .hero-sub { font-size:15px; color:rgba(255,255,255,0.45); font-weight:300; max-width:380px; margin:0 auto 36px; line-height:1.7; }
        .hero-ctas { display:flex; gap:14px; justify-content:center; flex-wrap:wrap; pointer-events:all; }

        /* Hero logo zoom */
        .hero-logo-zoom { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) scale(0.1); z-index:4; opacity:0; pointer-events:none; will-change:transform,opacity; }
        .hero-logo-zoom span { font-family:'Bebas Neue',sans-serif; font-size:clamp(140px,22vw,320px); letter-spacing:12px; color:transparent; -webkit-text-stroke:1px rgba(255,59,0,0.5); line-height:1; white-space:nowrap; }

        /* Card stack */
        .card-stack { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); z-index:6; opacity:0; pointer-events:none; width:clamp(180px,28vw,320px); }
        .stack-card { position:absolute; top:0; left:0; width:100%; transform-origin:bottom center; }
        .stack-card-inner { border:1.5px dashed rgba(255,59,0,0.5); padding:40px 28px; min-height:340px; display:flex; flex-direction:column; justify-content:space-between; position:relative; }
        .stack-card--1 .stack-card-inner { background:#0f0f0f; }
        .stack-card--2 .stack-card-inner { background:#111; }
        .stack-card--3 .stack-card-inner { background:#0d0d0d; }
        .stack-label { font-family:'Bebas Neue',sans-serif; font-size:13px; letter-spacing:4px; color:#FF3B00; }
        .stack-quote { font-size:22px; font-weight:700; color:#fff; line-height:1.3; margin-top:auto; }
        .stack-tag { font-size:10px; letter-spacing:3px; color:rgba(255,255,255,0.25); text-transform:uppercase; }

        /* Scroll hint */
        .scroll-hint { position:absolute; bottom:36px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:10px; z-index:5; }
        .scroll-hint span { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:rgba(255,255,255,0.25); }
        .scroll-line { width:1px; height:48px; background:repeating-linear-gradient(180deg,#FF3B00 0,#FF3B00 5px,transparent 5px,transparent 9px); animation:pulse 1.8s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:0.15} }

        /* Buttons */
        .btn-red { background:#FF3B00; color:#fff; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:14px 32px; border:none; cursor:none; font-family:'Inter',sans-serif; transition:transform 0.15s,box-shadow 0.15s,background 0.2s; display:inline-block; }
        .btn-red:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(255,59,0,0.4); background:#ff4d1a; }
        .btn-red:active { transform:translateY(0); box-shadow:none; }
        .btn-ghost { background:transparent; color:rgba(255,255,255,0.55); font-size:12px; font-weight:500; letter-spacing:1.5px; text-transform:uppercase; padding:14px 28px; border:1px dashed rgba(255,255,255,0.18); cursor:none; font-family:'Inter',sans-serif; transition:border-color 0.2s,color 0.2s,background 0.2s; display:inline-block; }
        .btn-ghost:hover { border-color:rgba(255,255,255,0.5); color:#fff; background:rgba(255,255,255,0.04); }
        .btn-ghost:active { background:rgba(255,255,255,0.08); }
        .btn-dark { background:#000; color:#FF3B00; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:14px 28px; border:1px solid #FF3B00; cursor:none; font-family:'Inter',sans-serif; white-space:nowrap; transition:background 0.2s,color 0.2s,transform 0.15s; display:inline-block; }
        .btn-dark:hover { background:#FF3B00; color:#fff; transform:translateY(-1px); }
        .btn-dark:active { transform:translateY(0); }

        /* Reveal */
        .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s ease, transform 0.7s ease; }
        .reveal.in { opacity:1; transform:none; }

        /* Section */
        .section { padding:100px 48px; max-width:1400px; margin:0 auto; }
        .section-head { margin-bottom:56px; }
        .eye { font-size:11px; font-weight:600; letter-spacing:4px; text-transform:uppercase; color:#FF3B00; margin-bottom:12px; display:block; }
        .sec-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(52px,8vw,100px); letter-spacing:2px; line-height:1; color:#fff; }

        /* Collections */
        .cols-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(255,59,0,0.08); }
        .col-card { background:#080808; padding:40px 28px; min-height:240px; position:relative; overflow:hidden; cursor:none; border:1px solid rgba(255,255,255,0.04); display:flex; flex-direction:column; justify-content:space-between; transition:border-color 0.3s,background 0.3s; }
        .col-card:hover { background:#0f0f0f; border-color:rgba(255,59,0,0.3); }
        .col-card--wide { grid-column:span 2; min-height:300px; }
        .col-tag { font-size:9px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,255,255,0.25); border:1px dashed rgba(255,255,255,0.12); padding:4px 10px; width:fit-content; }
        .col-bottom { display:flex; flex-direction:column; gap:6px; }
        .col-name { font-family:'Bebas Neue',sans-serif; font-size:44px; letter-spacing:2px; color:#fff; line-height:1; }
        .col-cta { background:none; border:none; font-size:12px; font-weight:600; letter-spacing:2px; text-transform:uppercase; cursor:none; padding:0; font-family:'Inter',sans-serif; transition:letter-spacing 0.25s, opacity 0.2s; }
        .col-cta:hover { letter-spacing:4px; opacity:0.8; }
        .col-num { position:absolute; bottom:16px; right:20px; font-family:'Bebas Neue',sans-serif; font-size:80px; color:rgba(255,255,255,0.03); line-height:1; pointer-events:none; }
        .col-card:hover .col-num { color:rgba(255,59,0,0.05); }

        /* Products */
        .prods-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1px; background:rgba(255,59,0,0.06); }
        .prod-card { background:#080808; cursor:none; overflow:hidden; border:1px solid rgba(255,255,255,0.04); transition:border-color 0.3s,transform 0.3s; position:relative; }
        .prod-card:hover { border-color:rgba(255,59,0,0.3); transform:translateY(-3px); }
        .prod-img { position:relative; aspect-ratio:3/4; overflow:hidden; background:#111; display:block; }
        .prod-img img { width:100%; height:100%; object-fit:cover; transition:transform 0.5s; display:block; }
        .prod-card:hover .prod-img img { transform:scale(1.05); }
        .prod-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.25s; z-index:2; pointer-events:none; }
        .prod-card:hover .prod-overlay { opacity:1; }
        .prod-overlay span { background:#FF3B00; color:#fff; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:10px 22px; display:block; }
        .prod-badge { position:absolute; top:14px; left:14px; background:#FF3B00; color:#fff; font-size:9px; font-weight:800; letter-spacing:2px; text-transform:uppercase; padding:4px 10px; }
        .prod-info { padding:20px 16px 24px; background:#0a0a0a; border-top:1px dashed rgba(255,59,0,0.15); }
        .prod-name { font-size:14px; font-weight:500; color:#fff; margin-bottom:6px; }
        .prod-price { font-size:14px; font-weight:600; color:rgba(255,255,255,0.4); }
        .prod-no-img { width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.1); font-size:13px; }
        .empty { text-align:center; padding:80px 20px; border:1px dashed rgba(255,59,0,0.2); color:rgba(255,255,255,0.3); font-size:14px; }

        /* Story */
        .story { padding:100px 48px; background:#0a0a0a; border-top:1px dashed rgba(255,59,0,0.15); border-bottom:1px dashed rgba(255,59,0,0.15); }
        .story-inner { max-width:1400px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:start; }
        .story-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(52px,7vw,88px); letter-spacing:2px; line-height:1; color:#fff; margin:16px 0 28px; }
        .story-body { font-size:15px; color:rgba(255,255,255,0.45); line-height:1.9; font-weight:300; margin-bottom:16px; }
        .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:rgba(255,59,0,0.1); margin-bottom:24px; }
        .stat-box { background:#0a0a0a; padding:36px 28px; border:1px dashed rgba(255,59,0,0.12); display:flex; flex-direction:column; gap:6px; }
        .stat-val { font-family:'Bebas Neue',sans-serif; font-size:52px; letter-spacing:2px; color:#FF3B00; line-height:1; }
        .stat-lbl { font-size:10px; font-weight:600; letter-spacing:2.5px; text-transform:uppercase; color:rgba(255,255,255,0.28); }
        .story-quote { border:1px dashed rgba(255,59,0,0.25); padding:28px 28px; background:#080808; }
        .story-quote p { font-size:15px; color:rgba(255,255,255,0.6); font-style:italic; line-height:1.7; margin-bottom:12px; }
        .story-quote span { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,59,0,0.6); }

        /* Testimonials */
        .testi { padding:100px 48px; text-align:center; }
        .testi-inner { max-width:680px; margin:0 auto; }
        .testi-card { padding-top:40px; display:flex; flex-direction:column; align-items:center; gap:20px; }
        .testi-stars { color:#FF3B00; font-size:18px; letter-spacing:6px; }
        .testi-q { font-size:clamp(20px,3vw,28px); font-weight:300; color:rgba(255,255,255,0.85); line-height:1.5; font-style:italic; }
        .testi-author { display:flex; flex-direction:column; gap:4px; }
        .testi-name { font-size:13px; font-weight:600; color:#fff; }
        .testi-role { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,0.28); }
        .testi-dots { display:flex; gap:8px; margin-top:8px; }
        .tdot { width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.12); border:none; cursor:none; transition:background 0.2s,transform 0.2s; }
        .tdot--on { background:#FF3B00; transform:scale(1.4); }

        /* Newsletter */
        .nl { background:#FF3B00; padding:100px 48px; }
        .nl-inner { max-width:600px; margin:0 auto; text-align:center; }
        .nl-title { font-family:'Bebas Neue',sans-serif; font-size:clamp(44px,7vw,80px); letter-spacing:2px; color:#000; line-height:1; margin:12px 0 16px; }
        .nl-sub { font-size:14px; color:rgba(0,0,0,0.55); margin-bottom:36px; }
        .nl-form { display:flex; max-width:440px; margin:0 auto; border:1px solid rgba(0,0,0,0.25); }
        .nl-input { flex:1; padding:14px 18px; background:rgba(0,0,0,0.08); border:none; color:#000; font-size:14px; outline:none; font-family:'Inter',sans-serif; }
        .nl-input::placeholder { color:rgba(0,0,0,0.35); }
        .nl-done { font-size:16px; font-weight:700; color:#000; letter-spacing:1px; }

        /* Footer */
        .footer { padding:48px; border-top:1px dashed rgba(255,59,0,0.15); }
        .footer-top { max-width:1400px; margin:0 auto 28px; display:flex; align-items:center; justify-content:space-between; }
        .footer-logo { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:6px; color:rgba(255,255,255,0.3); }
        .footer-links { display:flex; gap:28px; }
        .footer-links a { font-size:11px; color:rgba(255,255,255,0.25); text-decoration:none; letter-spacing:1.5px; text-transform:uppercase; transition:color 0.2s; }
        .footer-links a:hover { color:rgba(255,59,0,0.8); }
        .footer-bottom { max-width:1400px; margin:0 auto; display:flex; justify-content:space-between; font-size:11px; color:rgba(255,255,255,0.18); border-top:1px dashed rgba(255,255,255,0.06); padding-top:24px; }

        /* ── Shoe Rotator ── */
        .rotator-section { height: 400vh; position: relative; }
        .rotator-sticky { position: sticky; top: 0; height: 100vh; width: 100%; background: #050505; overflow: hidden; display: flex; flex-direction: column; justify-content: center; border-top: 1px dashed rgba(255,59,0,0.15); }

        /* Loading */
        .rotator-loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; z-index: 10; }
        .rotator-loading-bar { width: 240px; height: 1px; background: rgba(255,255,255,0.08); position: relative; overflow: hidden; }
        .rotator-loading-fill { height: 100%; background: #FF3B00; transition: width 0.2s linear; }
        .rotator-loading-text { font-size: 10px; font-weight: 700; letter-spacing: 4px; color: rgba(255,255,255,0.25); font-family: 'Inter', sans-serif; }

        /* Split layout */
        .rotator-split { display: grid; grid-template-columns: 1fr 1fr; height: 100%; align-items: center; padding: 0 48px; gap: 48px; opacity: 0; transition: opacity 0.6s; }
        .rotator-split--visible { opacity: 1; }

        /* Canvas side */
        .rotator-canvas-wrap { position: relative; display: flex; align-items: center; justify-content: center; height: 100%; padding: 48px 0; }
        .rotator-canvas { width: 100%; max-height: 75vh; object-fit: contain; display: block; filter: drop-shadow(0 0 60px rgba(255,59,0,0.08)); }

        /* Text side */
        .rotator-text-wrap { display: flex; align-items: center; }
        .rotator-text-inner { opacity: 0; transform: translateX(24px); transition: opacity 0.6s, transform 0.6s; }
        .rotator-text--in { opacity: 1; transform: none; }
        .rotator-eye { font-size: 10px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #FF3B00; display: block; margin-bottom: 16px; }
        .rotator-headline { font-family: 'Bebas Neue', sans-serif; font-size: clamp(64px, 9vw, 120px); line-height: 0.9; letter-spacing: 1px; color: #fff; margin-bottom: 40px; }
        .rotator-headline-outline { color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,0.2); display: block; }

        /* Scroll-triggered phrases */
        .rotator-phrases { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
        .rotator-phrase { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.25); opacity: 0; transform: translateX(16px); transition: opacity 0.5s, transform 0.5s, color 0.5s; }
        .rotator-phrase--in { opacity: 1; transform: none; color: rgba(255,255,255,0.7); }
        .rotator-phrase-dot { width: 5px; height: 5px; border-radius: 50%; background: #FF3B00; flex-shrink: 0; opacity: 0.5; transition: opacity 0.5s; }
        .rotator-phrase--in .rotator-phrase-dot { opacity: 1; }

        /* CTA */
        .rotator-cta { opacity: 0; transform: translateY(12px); transition: opacity 0.5s, transform 0.5s; }
        .rotator-cta--show { opacity: 1; transform: none; }
        .rotator-btn { display: inline-block; background: #FF3B00; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; padding: 14px 28px; text-decoration: none; font-family: 'Inter', sans-serif; transition: transform 0.15s, box-shadow 0.15s; }
        .rotator-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(255,59,0,0.35); }

        /* Progress bar */
        .rotator-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: rgba(255,255,255,0.05); }
        .rotator-progress-fill { height: 100%; background: #FF3B00; transition: width 0.1s linear; }

        /* Scroll hint */
        .rotator-scroll-hint { position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; opacity: 0; transition: opacity 0.5s; pointer-events: none; }
        .rotator-scroll-hint--show { opacity: 1; }
        .rotator-scroll-hint span { font-size: 9px; font-weight: 700; letter-spacing: 3px; color: rgba(255,255,255,0.2); white-space: nowrap; font-family: 'Inter', sans-serif; }
        .rotator-scroll-line { width: 32px; height: 1px; background: rgba(255,59,0,0.3); }

        @media (max-width: 768px) {
          .rotator-split { grid-template-columns: 1fr; padding: 20px; gap: 0; grid-template-rows: 1fr auto; }
          .rotator-canvas-wrap { height: 50vh; padding: 20px 0; }
          .rotator-text-inner { text-align: center; }
          .rotator-phrase { justify-content: center; }
        }

        @media (max-width: 768px) {
          .nav { padding:0 20px; } .nav-links { display:none; }
          .hero-title, .hero-sticky { padding:0 20px; }
          .section { padding:72px 20px; }
          .cols-grid { grid-template-columns:1fr 1fr; }
          .col-card--wide { grid-column:span 2; }
          .story { padding:72px 20px; }
          .story-inner { grid-template-columns:1fr; gap:48px; }
          .testi { padding:72px 20px; }
          .nl { padding:72px 20px; }
          .nl-form { flex-direction:column; }
          .nl-input { border-bottom:1px solid rgba(0,0,0,0.15); }
          .footer { padding:36px 20px; }
          .footer-top { flex-direction:column; gap:20px; text-align:center; }
          .footer-bottom { flex-direction:column; gap:8px; text-align:center; }
`;

/* ── App ── */
export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    shopifyFetch({ query: PRODUCTS_QUERY })
      .then(res => {
        if (res?.data?.products) setProducts(res.data.products.edges.map((e: { node: Product }) => e.node));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [products]);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <style>{CSS}</style>
      <Routes>
        <Route path="/" element={
          <>
            <Cursor />
            <Navbar onSearchOpen={() => setSearchOpen(true)} />
            <Hero onShopClick={() => scrollTo('products')} />
            <ShoeRotator frameCount={30} framePrefix="/shoe/frame-" frameSuffix=".png" framePad={3} />
            <Marquee />
            <Collections />
            <Products products={products} onProductClick={setSelected} />
            <Marquee inverted />
            <Story />
            <Testimonials />
            <Newsletter />
            <Footer />
            {selected && (
              <Suspense fallback={null}>
                <ProductModal handle={selected} onClose={() => setSelected(null)} />
              </Suspense>
            )}
            {searchOpen && (
              <SearchModal
                onClose={() => setSearchOpen(false)}
                onProductClick={(handle) => { setSelected(handle); setSearchOpen(false); }}
              />
            )}
            <CartModal />
          </>
        } />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </>
  );
}