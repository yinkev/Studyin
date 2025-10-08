'use client';

/**
 * Home Page - Material Design 3 Edition
 *
 * Complete redesign using Material Web Components and official MD3 design tokens.
 * Features hero section, progress stats, quick actions, and final CTA.
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AnalyticsSummary {
  overall_accuracy?: number;
  study_time_hours?: number;
}

export default function Page() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    // Load analytics client-side
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(() => setAnalytics(null));
  }, []);

  const accuracy = typeof analytics?.overall_accuracy === 'number'
    ? Math.round(analytics.overall_accuracy * 100)
    : null;
  const studyHours = typeof analytics?.study_time_hours === 'number'
    ? analytics.study_time_hours.toFixed(1)
    : null;

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--md-sys-color-surface)' }}>
      {/* Hero Section */}
      <section style={{ padding: '8rem 1.5rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          <div className="md3-surface-container md3-elevation-2 md3-shape-extra-large" style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--md-sys-color-surface-container), var(--md-sys-color-surface-container-high))'
          }}>
            {/* Logo */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <div className="md3-elevation-3" style={{
                width: '5rem',
                height: '5rem',
                background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))',
                borderRadius: 'var(--md-sys-shape-corner-extra-large)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-on-primary)" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
            </div>

            {/* Heading */}
            <h1 className="md3-display-large" style={{
              marginBottom: '1.5rem',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 900
            }}>
              Master medical knowledge <br/>with <span style={{ color: 'var(--md-sys-color-primary)' }}>confidence</span>
            </h1>

            {/* Subheading */}
            <p className="md3-headline-small" style={{
              marginBottom: '3rem',
              maxWidth: '42rem',
              marginLeft: 'auto',
              marginRight: 'auto',
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Playful, focused, and fast. Learn with evidence-anchored practice and spaced-recall analytics powered by AI magic.
            </p>

            {/* Primary CTA */}
            <Link href="/study">
              <md-filled-button style={{
                fontSize: '1.125rem',
                padding: '1rem 3rem',
                '--md-filled-button-container-shape': '9999px'
              }}>
                Start Learning Journey ✨
              </md-filled-button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Preview - Only show if real data exists */}
      {(accuracy !== null || studyHours !== null) && (
        <section style={{ padding: '6rem 1.5rem' }}>
          <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              {/* Your Progress Card */}
              <div className="md3-surface-container md3-elevation-2 md3-shape-large" style={{ padding: '2rem' }}>
                <div style={{
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                  marginBottom: '1rem'
                }}>
                  <h3 className="md3-headline-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Your Progress
                  </h3>
                </div>
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {accuracy !== null && (
                      <div style={{ textAlign: 'center' }}>
                        <div className="md3-display-medium" style={{
                          color: 'var(--md-sys-color-tertiary)',
                          fontWeight: 900,
                          marginBottom: '0.5rem'
                        }}>
                          {accuracy}%
                        </div>
                        <div className="md3-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Accuracy Rate
                        </div>
                      </div>
                    )}
                    {studyHours !== null && (
                      <div style={{ textAlign: 'center' }}>
                        <div className="md3-display-medium" style={{
                          color: 'var(--md-sys-color-primary)',
                          fontWeight: 900,
                          marginBottom: '0.5rem'
                        }}>
                          {studyHours}h
                        </div>
                        <div className="md3-body-small" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
                          Study Time
                        </div>
                      </div>
                    )}
                  </div>
                  <Link href="/dashboard" style={{ display: 'block', marginTop: '1.5rem' }}>
                    <md-outlined-button style={{ width: '100%' }}>
                      View Dashboard →
                    </md-outlined-button>
                  </Link>
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="md3-surface-container md3-elevation-2 md3-shape-large" style={{ padding: '2rem' }}>
                <div style={{
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--md-sys-color-outline-variant)',
                  marginBottom: '1rem'
                }}>
                  <h3 className="md3-headline-medium" style={{ color: 'var(--md-sys-color-on-surface)' }}>
                    Quick Actions
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link href="/study">
                    <md-filled-button style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <svg slot="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                      </svg>
                      Continue Studying
                    </md-filled-button>
                  </Link>
                  <Link href="/summary">
                    <md-filled-tonal-button style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <svg slot="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                      View Analytics
                    </md-filled-tonal-button>
                  </Link>
                  <Link href="/upload">
                    <md-outlined-button style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <svg slot="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload Content
                    </md-outlined-button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section style={{ padding: '8rem 1.5rem' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div className="md3-surface-container md3-elevation-3 md3-shape-extra-large" style={{
            textAlign: 'center',
            padding: '3rem 2rem'
          }}>
            <h2 className="md3-display-medium" style={{
              marginBottom: '1.5rem',
              color: 'var(--md-sys-color-on-surface)',
              fontWeight: 900
            }}>
              Ready to level up?
            </h2>
            <p className="md3-headline-small" style={{
              marginBottom: '3rem',
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Your AI-powered study companion is waiting
            </p>
            <Link href="/study">
              <md-filled-button style={{
                fontSize: '1.125rem',
                padding: '1rem 3rem',
                '--md-filled-button-container-shape': '9999px'
              }}>
                Start Now 🚀
              </md-filled-button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
