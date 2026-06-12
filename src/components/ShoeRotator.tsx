import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface ShoeRotatorProps {
  frameCount?: number;       // total number of frames you have
  framePrefix?: string;      // path prefix e.g. "/shoe/frame-"
  frameSuffix?: string;      // e.g. ".png"
  framePad?: number;         // zero-padding digits e.g. 3 → "001"
}

export default function ShoeRotator({
  frameCount = 23,
  framePrefix = '/shoe/frame-',
  frameSuffix = '.png',
  framePad = 3,
}: ShoeRotatorProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'loading' | 'rotating' | 'done'>('loading');

  // Build padded frame path e.g. "/shoe/frame-001.png"
  const framePath = (i: number) => {
    const n = String(i + 1).padStart(framePad, '0');
    return `${framePrefix}${n}${frameSuffix}`;
  };

  // Preload all frames
  useEffect(() => {
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      img.src = framePath(i);
      img.onload = () => {
        loaded++;
        setLoadProgress(Math.round((loaded / frameCount) * 100));
        if (loaded === frameCount) {
          setLoaded(true);
          setCurrentPhase('rotating');
          drawFrame(0, images);
        }
      };
      img.onerror = () => {
        // Still count errored frames so we don't hang
        loaded++;
        setLoadProgress(Math.round((loaded / frameCount) * 100));
        if (loaded === frameCount) {
          setLoaded(true);
          setCurrentPhase('rotating');
        }
      };
      images.push(img);
    }
    imagesRef.current = images;
  }, [frameCount]);

  const drawFrame = (index: number, images?: HTMLImageElement[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgs = images || imagesRef.current;
    const img = imgs[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas to img aspect ratio
    const aspect = img.naturalWidth / img.naturalHeight;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetWidth / aspect;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  // Scroll-driven frame swap
  useEffect(() => {
    if (!loaded) return;

    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionH = section.offsetHeight;
      const viewH = window.innerHeight;

      // Progress 0→1 over the sticky scroll range
      const scrolled = -rect.top;
      const maxScroll = sectionH - viewH;
      const progress = Math.min(Math.max(scrolled / maxScroll, 0), 1);

      // Frame index from progress
      const targetFrame = Math.min(
        Math.floor(progress * (frameCount - 1)),
        frameCount - 1
      );

      if (targetFrame !== frameRef.current) {
        frameRef.current = targetFrame;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => drawFrame(targetFrame));
      }

      // Text appears after 20% scroll
      setTextVisible(progress > 0.18);

      // Done phase when fully rotated
      if (progress >= 0.98) setCurrentPhase('done');
      else if (progress > 0) setCurrentPhase('rotating');
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [loaded, frameCount]);

  // Handle canvas resize
  useEffect(() => {
    const ro = new ResizeObserver(() => drawFrame(frameRef.current));
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [loaded]);

  const texts = [
    { pct: 0.18, line: 'SS 2026 DROP' },
    { pct: 0.38, line: 'ENGINEERED FOR SPEED' },
    { pct: 0.58, line: 'EVERY ANGLE. PERFECTED.' },
    { pct: 0.78, line: 'YOURS TO OWN.' },
  ];

  

  return (
    <section ref={sectionRef} className="rotator-section">
      <div className="rotator-sticky">

        {/* Loading screen */}
        {!loaded && (
          <div className="rotator-loading">
            <div className="rotator-loading-bar">
              <div className="rotator-loading-fill" style={{ width: `${loadProgress}%` }} />
            </div>
            <span className="rotator-loading-text">LOADING {loadProgress}%</span>
          </div>
        )}

        {/* Main split layout */}
        <div className={`rotator-split ${loaded ? 'rotator-split--visible' : ''}`}>

          {/* Left: Canvas */}
          <div className="rotator-canvas-wrap">
            <canvas ref={canvasRef} className="rotator-canvas" />
            {/* Frame counter debug — remove in prod */}
            {/* <span style={{position:'absolute',bottom:8,right:8,fontSize:10,color:'rgba(255,255,255,0.2)'}}>{frameRef.current + 1}/{frameCount}</span> */}
          </div>

          {/* Right: Text stack */}
          <div className="rotator-text-wrap">
            <div className={`rotator-text-inner ${textVisible ? 'rotator-text--in' : ''}`}>
              <span className="rotator-eye">LOTTO ATHLETIC</span>
              <h2 className="rotator-headline">
                360°<br />
                <span className="rotator-headline-outline">PRECISION</span>
              </h2>
              <div className="rotator-phrases">
                {texts.map((t, i) => (
                  <RotatorPhrase key={i} text={t.line} sectionRef={sectionRef} triggerPct={t.pct} totalPct={0.98} />
                ))}
              </div>
              <div className={`rotator-cta ${currentPhase === 'done' ? 'rotator-cta--show' : ''}`}>
                <a href="#products" className="rotator-btn">
                  Shop the Collection →
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Scroll progress bar */}
        <ScrollProgress sectionRef={sectionRef} />

        {/* Scroll hint — only at start */}
        <div className={`rotator-scroll-hint ${loaded && currentPhase === 'rotating' ? 'rotator-scroll-hint--show' : ''}`}>
          <div className="rotator-scroll-line" />
          <span>SCROLL TO ROTATE</span>
          <div className="rotator-scroll-line" />
        </div>

      </div>
    </section>
  );
}

/* Phrase that appears at a specific scroll % */
function RotatorPhrase({
  text,
  sectionRef,
  triggerPct,
  totalPct,
}: {
  text: string;
  sectionRef: RefObject<HTMLElement | null>;
  triggerPct: number;
  totalPct: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fn = () => {
      const section = sectionRef.current;
      if (!section) return;
      const scrolled = -section.getBoundingClientRect().top;
      const maxScroll = section.offsetHeight - window.innerHeight;
      const p = Math.min(Math.max(scrolled / maxScroll, 0), 1);
      setVisible(p >= triggerPct && p <= totalPct + 0.05);
    };
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, [sectionRef, triggerPct, totalPct]);

  return (
    <div className={`rotator-phrase ${visible ? 'rotator-phrase--in' : ''}`}>
      <span className="rotator-phrase-dot" />
      {text}
    </div>
  );
}

/* Thin red progress bar at bottom */
function ScrollProgress({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const section = sectionRef.current;
      if (!section) return;
      const scrolled = -section.getBoundingClientRect().top;
      const maxScroll = section.offsetHeight - window.innerHeight;
      setPct(Math.min(Math.max(scrolled / maxScroll, 0), 1) * 100);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [sectionRef]);
  return (
    <div className="rotator-progress">
      <div className="rotator-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}