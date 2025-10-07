'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const SPLIDE_CSS = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';

function ensureSplideCSS() {
  if (document.querySelector(`link[href="${SPLIDE_CSS}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = SPLIDE_CSS;
  document.head.appendChild(link);
}

export function SplideAchievements() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    ensureSplideCSS();
    const Splide = (window as any).Splide;
    const root = rootRef.current;
    if (!Splide || !root) return;
    const slider = new Splide(root.querySelector('.splide'), {
      perPage: 6,
      gap: '1rem',
      arrows: true,
      pagination: false,
      breakpoints: {
        1024: { perPage: 4 },
        640: { perPage: 3 },
      },
    });
    slider.mount();
    return () => slider.destroy();
  }, [ready]);

  const achievements = ['👶','⚡','🗓️','⭐','🤝','💪','🎯','🧠','🏅','🔥'];

  return (
    <div ref={rootRef} className="duo-card p-6">
      <Script
        src="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      {/* Keep heading order correct relative to the page (h2 > h3 > h4). */}
      <h3 className="text-xl font-bold mb-4">Achievements</h3>

      <div className="splide" aria-label="Achievements slider">
        <div className="splide__track">
          {/* use div+ARIA instead of ul/li to avoid aria-allowed-role on li */}
          <div className="splide__list" role="list">
            {achievements.map((g, i) => (
              <div className="splide__slide" role="listitem" key={i}>
                <div
                  className="achievement-badge w-20 h-20 mx-auto flex items-center justify-center text-2xl cursor-pointer text-slate-800"
                  title="Achievement"
                >
                  {g}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
