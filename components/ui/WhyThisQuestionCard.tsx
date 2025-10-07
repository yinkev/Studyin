/**
 * User-Friendly Question Selection Explanation
 * Replaces cryptic IRT stats with plain English
 */

'use client';

import { useState } from 'react';
import { Card, Button, Modal } from '@mantine/core';

interface WhyThisQuestionCardProps {
  darkMode?: boolean;
  abilityLevel?: number;
  mastery?: number;
  informationValue?: number;
  blueprintWeight?: number;
  className?: string;
}

export function WhyThisQuestionCard({
  darkMode = false,
  abilityLevel = 0.67,
  mastery = 0.82,
  informationValue = 1.45,
  blueprintWeight = 1.2,
  className = '',
}: WhyThisQuestionCardProps) {
  const [showMathModal, setShowMathModal] = useState(false);

  const theme = darkMode ? {
    cardBg: 'rgba(30, 41, 59, 0.6)',
    cardBorder: 'rgba(71, 85, 105, 0.3)',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
  } : {
    cardBg: 'rgba(248, 250, 252, 0.95)',
    cardBorder: '#CBD5E1',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
  };

  const masteryPercent = Math.round(mastery * 100);
  const abilityPercentile = Math.round((1 + Math.erf(abilityLevel / Math.sqrt(2))) * 50); // rough percentile

  return (
    <>
      <Card className={`transition-all duration-500 ${className}`} style={{
        background: theme.cardBg,
        backdropFilter: darkMode ? 'blur(20px)' : 'none',
        borderRadius: '28px',
        boxShadow: darkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 0 #E5E7EB, 0 8px 16px rgba(0, 0, 0, 0.06)',
        border: darkMode ? `1px solid ${theme.cardBorder}` : 'none',
      }} padding="lg">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl transition-colors" style={{ background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="font-bold text-base transition-colors" style={{ color: theme.textPrimary }}>Why This Question?</h3>
            </div>

            <Button
              size="sm"
              variant="light"
              onClick={() => setShowMathModal(true)}
              rightSection={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            >
              How it works
            </Button>
          </div>

          {/* User-Friendly Explanation */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors" style={{
              background: darkMode ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: darkMode ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: theme.textPrimary }}>Perfect for your level</p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  Your estimated ability is <strong>Level {Math.round(abilityLevel * 10)} ({masteryPercent}% mastery)</strong>. This question matches your current knowledge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors" style={{
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
              border: darkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.2)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: theme.textPrimary }}>High learning value</p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  This question will give us <strong>{informationValue.toFixed(2)}x more insight</strong> into what you know compared to random selection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl transition-colors" style={{
              background: darkMode ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.1)',
              border: darkMode ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(168, 85, 247, 0.2)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
              </svg>
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: theme.textPrimary }}>Aligned with your goals</p>
                <p className="text-xs" style={{ color: theme.textSecondary }}>
                  This topic appears <strong>{Math.round((blueprintWeight - 1) * 100)}% more often</strong> in your target exam blueprint.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Math Explanation Modal */}
      <Modal
        opened={showMathModal}
        onClose={() => setShowMathModal(false)}
        size="xl"
        centered
        styles={{
          content: {
            background: theme.cardBg,
            backdropFilter: darkMode ? 'blur(20px)' : 'none',
            border: darkMode ? `1px solid ${theme.cardBorder}` : 'none',
          }
        }}
      >
        <div style={{ color: theme.textPrimary }}>
          <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: darkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
                  <polyline points="7.5 19.79 7.5 14.6 3 12"/>
                  <polyline points="21 12 16.5 14.6 16.5 19.79"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <span>How Adaptive Learning Works</span>
            </div>
          </div>
          <div className="pb-6">
            <div className="space-y-6" style={{ color: theme.textSecondary }}>
              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>📊 Your Ability Estimate (θ̂ = {abilityLevel.toFixed(2)})</h4>
                <p className="text-sm mb-2">
                  Based on your past performance, we estimate your knowledge level is <strong>{abilityLevel.toFixed(2)}</strong> on a scale from -3 to +3.
                </p>
                <p className="text-xs">
                  ✓ You're performing better than {abilityPercentile}% of learners<br/>
                  ✓ Equivalent to ~{masteryPercent}% average mastery
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>🎯 Uncertainty (SE = 0.12)</h4>
                <p className="text-sm mb-2">
                  We're <strong>very confident</strong> about your ability level (low standard error of 0.12).
                </p>
                <p className="text-xs">
                  ✓ More questions answered = lower uncertainty<br/>
                  ✓ We can now show you more challenging material
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>💡 Information Value (Info = {informationValue.toFixed(2)})</h4>
                <p className="text-sm mb-2">
                  This question provides <strong>{informationValue.toFixed(2)}x more information</strong> than a random question.
                </p>
                <p className="text-xs">
                  ✓ Higher = better at revealing what you know<br/>
                  ✓ Questions near your ability level = most informative
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>📋 Blueprint Weight (×{blueprintWeight.toFixed(1)})</h4>
                <p className="text-sm mb-2">
                  This topic appears <strong>{Math.round((blueprintWeight - 1) * 100)}% more often</strong> in your target exam.
                </p>
                <p className="text-xs">
                  ✓ We prioritize high-value topics<br/>
                  ✓ Ensures you're prepared for what matters most
                </p>
              </div>

              <div className="p-4 rounded-2xl mt-6" style={{
                background: darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                border: darkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.1)',
              }}>
                <p className="text-sm font-semibold mb-2" style={{ color: theme.textPrimary }}>
                  🧠 The Algorithm
                </p>
                <p className="text-xs">
                  We use <strong>Item Response Theory (IRT)</strong> with blueprint weighting. Each answer updates your ability estimate in real-time, ensuring you always get questions that maximize learning while staying aligned with your exam goals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
