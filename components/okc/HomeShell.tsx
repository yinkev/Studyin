'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { EChartsClient } from './EChartsClient';
import { ThreeAnatomy } from './ThreeAnatomy';
import { SplideAchievements } from './SplideAchievements';

type AnalyticsSummary = { accuracy_overall?: number; study_time_hours?: number; progress_overall?: number };

function ProgressRing({ progress = 0.68 }: { progress?: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = useMemo(() => circumference - progress * circumference, [circumference, progress]);
  return (
    <div className="relative w-24 h-24 mx-auto mb-4" aria-label="overall progress">
      <svg className="okc-progress-ring w-24 h-24" viewBox="0 0 96 96" role="img" aria-hidden>
        <circle className="okc-progress-circle" stroke="var(--okc-feather)" strokeWidth="4" fill="transparent" r={radius} cx="48" cy="48" style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color: 'var(--okc-feather)' }}>{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

export function HomeShell({ analytics }: { analytics: AnalyticsSummary | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const cards = root.querySelectorAll<HTMLElement>('.duo-card, .okc-module-card');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const anime = (window as any).anime;
          if (anime) {
            anime({ targets: e.target, translateY: [20,0], opacity: [0,1], duration: 600, easing: 'easeOutQuad' });
          } else {
            (e.target as HTMLElement).style.opacity = '1';
            (e.target as HTMLElement).style.transform = 'translateY(0)';
          }
        }
      });
    }, { threshold: 0.12 });
    cards.forEach((c) => { c.style.opacity = '0'; c.style.transform = 'translateY(12px)'; obs.observe(c); });
    return () => obs.disconnect();
  }, []);

  const progress = typeof analytics?.progress_overall === 'number' ? Math.max(0, Math.min(1, analytics.progress_overall)) : 0.68;
  const accuracy = typeof analytics?.accuracy_overall === 'number' ? Math.round(analytics.accuracy_overall * 100) : 94;
  const studyHours = typeof analytics?.study_time_hours === 'number' ? analytics.study_time_hours.toFixed(1) : '2.3';

  const burst = (e: React.MouseEvent) => {
    const root = ref.current; if (!root) return;
    const box = root.getBoundingClientRect(); const x = e.clientX - box.left; const y = e.clientY - box.top;
    const colors = ['#58CC02','#89E219','#1CB0F6','#FFC800'];
    for (let i=0;i<12;i++) { const d = document.createElement('div'); d.className='okc-confetti'; d.style.left=`${x}px`; d.style.top=`${y}px`; d.style.position='absolute'; d.style.background = colors[i%colors.length]; d.style.transform='translate(-50%,-50%)'; d.style.animationDelay = `${Math.random()*0.4}s`; root.appendChild(d); setTimeout(()=>d.remove(), 3200);}  
  };

  return (
    <div ref={ref} className="okc-light bg-gradient-to-br from-slate-50 to-slate-200 text-gray-900">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js" strategy="afterInteractive" />
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-black mb-6">Master Medical Knowledge with <span className="bouncy-text" style={{ color: 'var(--okc-feather)' }}>Confidence</span></h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">Experience the joy of learning with a playful interface. Bold, bouncy, and bright—made for momentum.</p>
          <Link href="/study" className="inline-block duo-button px-8 py-4 text-white font-bold text-lg" aria-label="Start learning journey">Start Learning Journey 🚀</Link>
        </div>
      </section>

      {/* Dashboard */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
          <div className="duo-card p-6" role="region" aria-label="overall progress">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Overall Progress</h2><span className="text-2xl" aria-hidden>📊</span></div>
            <ProgressRing progress={progress} />
            <p className="text-sm text-gray-700 text-center">Keep up the great work!</p>
          </div>
          <div className="duo-card p-6" role="region" aria-label="weekly goal">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Weekly Goal</h2><span className="text-2xl" aria-hidden>🎯</span></div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span>Lessons Completed</span><span className="font-bold">—</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2" aria-hidden><div className="duo-progress h-2 rounded-full" style={{ width: `${Math.round(progress*100)}%` }} /></div>
              <p className="text-xs text-gray-700">Stay consistent to reach your goal.</p>
            </div>
          </div>
          <div className="duo-card p-6" role="region" aria-label="latest achievement">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Latest Achievement</h2><span className="text-2xl" aria-hidden>🏅</span></div>
            <div className="text-center">
              <button onClick={burst} className="achievement-badge w-16 h-16 mx-auto mb-3 flex items-center justify-center text-2xl focus:outline-none" aria-label="Celebrate latest achievement">💪</button>
              <h4 className="font-bold">Knowledge Seeker</h4>
              <p className="text-sm text-gray-700">Keep the streak going!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-12 px-4 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[{icon:'💪',title:'Upper Limb Anatomy',href:'/study?module=upper-limb',pct:67},{icon:'🧠',title:'Neuroanatomy',href:'/study?module=neuro',pct:20},{icon:'❤️',title:'Cardiac Physiology',href:'/study?module=cardiac',pct:45}].map((m)=> (
              <Link key={m.title} href={m.href} className="okc-module-card p-6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-2xl rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--okc-macaw) 0%, var(--okc-feather) 100%)' }} aria-hidden>{m.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-center">{m.title}</h3>
                <p className="text-gray-700 text-sm mb-4 text-center">Adaptive drills and evidence-anchored practice.</p>
                <div className="space-y-2 mb-4" aria-hidden>
                  <div className="flex justify-between text-sm"><span>Progress</span><span className="font-bold" style={{ color: 'var(--okc-feather)' }}>{m.pct}%</span></div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="duo-progress h-2 rounded-full" style={{ width: `${m.pct}%` }} /></div>
                </div>
                <div className="w-full duo-button py-3 text-white font-bold text-center">Continue Learning →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive + Analytics */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="duo-card p-8" role="region" aria-label="3D anatomy explorer">
            <h3 className="text-2xl font-bold mb-4">3D Anatomy Explorer</h3>
            <div className="rounded-2xl overflow-hidden border border-gray-200 mb-6">
              <ThreeAnatomy height={280} />
            </div>
            <div className="flex gap-4">
              <button className="flex-1 duo-button py-3 text-white font-bold">🔄 Rotate Model</button>
              <Link href="/study" className="flex-1 bg-gray-200 hover:bg-gray-300 py-3 rounded-2xl font-bold text-center transition-colors">🎯 Quiz Mode</Link>
            </div>
          </div>
          <div className="duo-card p-8" role="region" aria-label="learning analytics">
            <h3 className="text-2xl font-bold mb-4">Learning Analytics</h3>
            <EChartsClient height={256} />
            <div className="mt-6 grid grid-cols-2 gap-4" aria-live="polite">
              <div className="text-center p-4 bg-green-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: 'var(--okc-feather)' }}>{accuracy}%</div>
                <div className="text-sm text-gray-700">Accuracy Rate</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: 'var(--okc-macaw)' }}>{studyHours}h</div>
                <div className="text-sm text-gray-700">Study Time</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700">See full details in <Link href="/summary" className="font-semibold text-sky-700 underline">Summary</Link>.</div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 px-4 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">Your Achievement Gallery</h2>
          <SplideAchievements />
        </div>
      </section>
    </div>
  );
}
