import { HeroSection } from '../components/landing/HeroSection';
import { ModuleCard } from '../components/landing/ModuleCard';
import { SplideAchievements } from '../components/okc/SplideAchievements';
import { ThreeAnatomy } from '../components/okc/ThreeAnatomy';
import { EChartsClient } from '../components/okc/EChartsClient';
import Link from 'next/link';
import { loadAnalyticsSummary } from '../lib/getAnalytics';

export default async function Page() {
  const analytics = await loadAnalyticsSummary();
  const accuracy = typeof (analytics as any)?.overall_accuracy === 'number'
    ? Math.round((analytics as any).overall_accuracy * 100)
    : 94;
  const studyHours = typeof (analytics as any)?.study_time_hours === 'number'
    ? (analytics as any).study_time_hours.toFixed(1)
    : '2.3';

  return (
    <main className="relative">
      {/* Hero Section with Particle Field */}
      <HeroSection />

      {/* Module Cards Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center mb-4 text-white">
            Choose Your <span className="gradient-text">Learning Path</span>
          </h2>
          <p className="text-xl text-slate-400 text-center mb-16">
            Adaptive drills powered by Gemini + Codex AI
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ModuleCard
              icon="💪"
              title="Upper Limb Anatomy"
              description="Master anatomical structures, boundaries, and clinical correlations"
              progress={67}
              href="/study?module=upper-limb"
              gradient="linear-gradient(135deg, #58CC02 0%, #89E219 100%)"
            />
            <ModuleCard
              icon="🧠"
              title="Neuroanatomy"
              description="Explore neural pathways, cranial nerves, and CNS organization"
              progress={34}
              href="/study?module=neuro"
              gradient="linear-gradient(135deg, #1CB0F6 0%, #0891b2 100%)"
            />
            <ModuleCard
              icon="❤️"
              title="Cardiac Physiology"
              description="Understand cardiac cycle, ECG interpretation, and hemodynamics"
              progress={45}
              href="/study?module=cardiac"
              gradient="linear-gradient(135deg, #FF4B4B 0%, #dc2626 100%)"
            />
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="relative py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* 3D Anatomy Viewer */}
            <div className="glow-card p-8">
              <h3 className="text-3xl font-bold mb-6 text-white">
                3D Anatomy <span className="gradient-text">Explorer</span>
              </h3>
              <div className="rounded-3xl overflow-hidden border border-white/10 mb-6 bg-slate-900">
                <ThreeAnatomy height={320} />
              </div>
              <div className="flex gap-4">
                <button className="flex-1 py-4 rounded-2xl font-bold text-white transition-transform hover:scale-105" style={{ background: 'linear-gradient(135deg, #58CC02 0%, #89E219 100%)' }}>
                  🔄 Rotate Model
                </button>
                <Link href="/study" className="flex-1 py-4 rounded-2xl font-bold text-center text-slate-900 bg-white hover:bg-slate-100 transition-colors">
                  🎯 Quiz Mode
                </Link>
              </div>
            </div>

            {/* Analytics Preview */}
            <div className="glow-card p-8">
              <h3 className="text-3xl font-bold mb-6 text-white">
                Learning <span className="gradient-text">Analytics</span>
              </h3>
              <div className="mb-6">
                <EChartsClient height={280} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
                  <div className="text-4xl font-black text-green-400 mb-2">{accuracy}%</div>
                  <div className="text-sm text-slate-300">Accuracy rate</div>
                </div>
                <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <div className="text-4xl font-black text-blue-400 mb-2">{studyHours}h</div>
                  <div className="text-sm text-slate-300">Study time</div>
                </div>
              </div>
              <p className="text-sm text-slate-400">
                View detailed insights in{' '}
                <Link href="/summary" className="font-semibold text-sky-400 hover:text-sky-300 underline">
                  Analytics Dashboard →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement Gallery */}
      <section className="relative py-24 bg-gradient-to-br from-amber-900/20 via-orange-900/20 to-red-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-black text-center mb-4 text-white">
            Your Achievement <span className="gradient-text">Gallery</span>
          </h2>
          <p className="text-xl text-slate-400 text-center mb-12">
            Unlock badges as you master learning objectives
          </p>
          <SplideAchievements />
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 bg-gradient-to-br from-slate-900 via-blue-900/30 to-green-900/30">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-6xl font-black mb-6 text-white">
            Ready to <span className="gradient-text neon-blue">level up?</span>
          </h2>
          <p className="text-2xl text-slate-300 mb-12">
            Your AI-powered study companion is waiting
          </p>
          <Link
            href="/study"
            className="inline-block px-16 py-6 text-3xl font-black text-white rounded-full transition-all duration-300 hover:scale-110 shimmer"
            style={{
              background: 'linear-gradient(135deg, #1CB0F6 0%, #0891b2 100%)',
              boxShadow: '0 12px 48px rgba(28, 176, 246, 0.5)'
            }}
          >
            Start Now 🚀
          </Link>
        </div>
      </section>
    </main>
  );
}
