import { Card, Progress, Button } from '@mantine/core';
import Link from 'next/link';
import { loadAnalyticsSummary } from '../lib/getAnalytics';

export default async function Page() {
  const analytics = await loadAnalyticsSummary();
  const accuracy = typeof (analytics as any)?.overall_accuracy === 'number'
    ? Math.round((analytics as any).overall_accuracy * 100)
    : null;
  const studyHours = typeof (analytics as any)?.study_time_hours === 'number'
    ? (analytics as any).study_time_hours.toFixed(1)
    : null;

  return (
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="glass-hero text-center">
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-brand-light to-brand-secondary rounded-3xl flex items-center justify-center shadow-lg">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
              </div>
              <h1 className="text-6xl font-black text-text-high mb-6">
                Master medical knowledge <br/>with <span className="text-brand-light">confidence</span>
              </h1>
              <p className="text-xl text-text-med mb-12 max-w-2xl mx-auto">
                Playful, focused, and fast. Learn with evidence-anchored practice and spaced-recall analytics powered by AI magic.
              </p>
              <Link href="/study">
                <Button size="lg" color="blue" variant="filled" className="text-lg px-12 py-7 font-bold rounded-full">
                  Start Learning Journey ✨
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Preview - Only show if real data exists */}
        {(accuracy !== null || studyHours !== null) && (
          <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-clinical-card">
                  <div className="pb-4 border-b border-border-subtle mb-4">
                    <h3 className="text-2xl font-bold text-text-high">Your Progress</h3>
                  </div>
                  <div>
                    <div className="grid grid-cols-2 gap-6">
                      {accuracy !== null && (
                        <div className="text-center">
                          <div className="text-5xl font-black text-semantic-success mb-2">{accuracy}%</div>
                          <div className="text-sm text-text-med">Accuracy Rate</div>
                        </div>
                      )}
                      {studyHours !== null && (
                        <div className="text-center">
                          <div className="text-5xl font-black text-brand-light mb-2">{studyHours}h</div>
                          <div className="text-sm text-text-med">Study Time</div>
                        </div>
                      )}
                    </div>
                    <Link href="/dashboard" className="block mt-6">
                      <Button fullWidth variant="outline">
                        View Dashboard →
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="glass-clinical-card">
                  <div className="pb-4 border-b border-border-subtle mb-4">
                    <h3 className="text-2xl font-bold text-text-high">Quick Actions</h3>
                  </div>
                  <div className="space-y-3">
                    <Link href="/study">
                      <Button fullWidth size="lg" color="blue" leftSection={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                      }>
                        Continue Studying
                      </Button>
                    </Link>
                    <Link href="/summary">
                      <Button fullWidth size="lg" variant="light" leftSection={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10"/>
                          <line x1="12" y1="20" x2="12" y2="4"/>
                          <line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                      }>
                        View Analytics
                      </Button>
                    </Link>
                    <Link href="/upload">
                      <Button fullWidth size="lg" variant="outline" leftSection={
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      }>
                        Upload Content
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-clinical-card text-center py-12">
              <h2 className="text-5xl font-black mb-6 text-text-high">
                Ready to level up?
              </h2>
              <p className="text-xl mb-12 text-text-med">
                Your AI-powered study companion is waiting
              </p>
              <Link href="/study">
                <Button size="lg" color="blue" variant="filled" className="px-12 py-7 text-lg font-bold rounded-full">
                  Start Now 🚀
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
  );
}
