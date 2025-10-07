import { Card, CardBody, CardHeader, Progress, Button } from '@heroui/react';
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
      <main className="min-h-screen bg-surface-bg1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-brand-light/10 to-brand-secondary/10 py-24">
          <div className="max-w-7xl mx-auto px-6 text-center">
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
              <Button size="lg" color="primary" className="text-lg px-12 py-7 font-bold rounded-full">
                Start Learning Journey ✨
              </Button>
            </Link>
          </div>
        </section>

        {/* Learning Paths */}
        <section className="py-24 bg-surface-bg0">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-4xl font-black text-center mb-4 text-text-high">
              Choose Your Learning Path
            </h2>
            <p className="text-lg text-text-med text-center mb-16">
              Adaptive drills powered by Gemini + Codex AI
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-semantic-success/10 text-semantic-success">
                      💪
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-text-high">Upper Limb Anatomy</h3>
                      <Progress value={67} color="success" size="sm" className="mt-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-text-med mb-4">
                    Master anatomical structures, boundaries, and clinical correlations
                  </p>
                  <Link href="/study?module=upper-limb">
                    <Button fullWidth color="success" variant="flat">
                      Continue Learning →
                    </Button>
                  </Link>
                </CardBody>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-brand-light/10 text-brand-light">
                      🧠
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-text-high">Neuroanatomy</h3>
                      <Progress value={34} color="primary" size="sm" className="mt-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-text-med mb-4">
                    Explore neural pathways, cranial nerves, and CNS organization
                  </p>
                  <Link href="/study?module=neuro">
                    <Button fullWidth color="primary" variant="flat">
                      Continue Learning →
                    </Button>
                  </Link>
                </CardBody>
              </Card>

              <Card className="hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-semantic-danger/10 text-semantic-danger">
                      ❤️
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-text-high">Cardiac Physiology</h3>
                      <Progress value={45} color="danger" size="sm" className="mt-2" />
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-text-med mb-4">
                    Understand cardiac cycle, ECG interpretation, and hemodynamics
                  </p>
                  <Link href="/study?module=cardiac">
                    <Button fullWidth color="danger" variant="flat">
                      Continue Learning →
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Preview */}
        <section className="py-24 bg-surface-bg1">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <h3 className="text-2xl font-bold text-text-high">Your Progress</h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-5xl font-black text-semantic-success mb-2">{accuracy}%</div>
                      <div className="text-sm text-text-med">Accuracy Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-brand-light mb-2">{studyHours}h</div>
                      <div className="text-sm text-text-med">Study Time</div>
                    </div>
                  </div>
                  <Link href="/dashboard" className="block mt-6">
                    <Button fullWidth variant="bordered">
                      View Dashboard →
                    </Button>
                  </Link>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-2xl font-bold text-text-high">Quick Actions</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  <Link href="/study">
                    <Button fullWidth size="lg" color="primary" startContent={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                    }>
                      Continue Studying
                    </Button>
                  </Link>
                  <Link href="/summary">
                    <Button fullWidth size="lg" variant="flat" startContent={
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
                    <Button fullWidth size="lg" variant="bordered" startContent={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    }>
                      Upload Content
                    </Button>
                  </Link>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-brand-light to-brand-secondary text-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-5xl font-black mb-6">
              Ready to level up?
            </h2>
            <p className="text-xl mb-12 text-brand-light/80">
              Your AI-powered study companion is waiting
            </p>
            <Link href="/study">
              <Button size="lg" className="bg-surface-bg0 text-brand-light hover:bg-brand-light/10 px-12 py-7 text-lg font-bold rounded-full">
                Start Now 🚀
              </Button>
            </Link>
          </div>
        </section>
      </main>
  );
}
