/**
 * NOVA - Dark Mode Version
 * Monochrome Pop in Dark Theme
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Chip, Avatar } from '@heroui/react';

export default function NovaDarkPage() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const correctAnswer = 'B';

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    }}>
      {/* Header */}
      <header className="border-b" style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'rgba(71, 85, 105, 0.3)',
      }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center"
              style={{
                borderRadius: '16px',
                background: '#3B82F6',
                boxShadow: '0 4px 0 #2563EB',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{
              color: '#F9FAFB',
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
            }}>
              Studyin
            </h1>
          </div>

          {/* Nav */}
          <nav className="flex gap-2">
            {['Study', 'Upload', 'Analytics', 'Dashboard'].map((item) => (
              <Button
                key={item}
                variant={item === 'Study' ? 'flat' : 'light'}
                color={item === 'Study' ? 'primary' : 'default'}
                size="sm"
              >
                {item}
              </Button>
            ))}
          </nav>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium" style={{ color: '#F9FAFB' }}>Level 7</div>
              <div className="text-xs" style={{ color: '#9CA3AF' }}>2,450 XP</div>
            </div>
            <Avatar
              className="w-10 h-10"
              style={{
                background: '#3B82F6',
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Study Card */}
        <Card className="mb-6" style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
        }}>
          <CardBody className="p-8">
            {/* Question */}
            <div className="mb-8">
              <Chip
                variant="flat"
                color="primary"
                className="mb-4"
                startContent={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                }
              >
                Question 3 of 10
              </Chip>

              <h2 className="text-3xl font-bold mb-2" style={{
                color: '#F9FAFB',
                fontFamily: 'Space Grotesk, system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}>
                What is the primary mechanism of action for ACE inhibitors?
              </h2>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                Select the most accurate answer below
              </p>
            </div>

            {/* Answer Choices */}
            <div className="space-y-3 mb-8">
              {[
                { id: 'A', text: 'Block aldosterone receptors in the kidney' },
                { id: 'B', text: 'Inhibit conversion of angiotensin I to angiotensin II' },
                { id: 'C', text: 'Directly vasodilate arterial smooth muscle' },
                { id: 'D', text: 'Block beta-1 receptors in the heart' },
              ].map((choice) => {
                const isSelected = selectedAnswer === choice.id;
                const isThisCorrect = choice.id === correctAnswer;
                const showFeedback = submitted;

                let backgroundColor = 'rgba(51, 65, 85, 0.5)';
                let borderColor = 'rgba(71, 85, 105, 0.4)';
                let textColor = '#F1F5F9';
                let shadowColor = 'none';

                if (showFeedback) {
                  if (isThisCorrect) {
                    backgroundColor = 'rgba(16, 185, 129, 0.9)';
                    borderColor = 'rgba(5, 150, 105, 0.5)';
                    textColor = '#FFFFFF';
                    shadowColor = '0 6px 0 #059669, 0 8px 24px rgba(16, 185, 129, 0.4)';
                  } else if (isSelected) {
                    backgroundColor = 'rgba(239, 68, 68, 0.9)';
                    borderColor = 'rgba(220, 38, 38, 0.5)';
                    textColor = '#FFFFFF';
                    shadowColor = '0 6px 0 #DC2626, 0 8px 24px rgba(239, 68, 68, 0.4)';
                  }
                } else if (isSelected) {
                  backgroundColor = 'rgba(59, 130, 246, 0.9)';
                  borderColor = 'rgba(37, 99, 235, 0.5)';
                  textColor = '#FFFFFF';
                  shadowColor = '0 6px 0 #2563EB, 0 8px 24px rgba(59, 130, 246, 0.4)';
                }

                return (
                  <button
                    key={choice.id}
                    onClick={() => !submitted && setSelectedAnswer(choice.id)}
                    disabled={submitted}
                    className="w-full text-left p-5 transition-all"
                    style={{
                      borderRadius: '24px',
                      background: backgroundColor,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${borderColor}`,
                      color: textColor,
                      fontWeight: '600',
                      fontSize: '15px',
                      boxShadow: shadowColor,
                      cursor: submitted ? 'default' : 'pointer',
                    }}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>

            {/* Confidence Rating */}
            {selectedAnswer && !submitted && (
              <div className="border-t pt-6 mb-6" style={{ borderColor: '#374151' }}>
                <p className="text-sm text-center mb-4" style={{ color: '#60A5FA' }}>
                  How confident are you in this answer?
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setConfidence(star)}
                      className="transition-all"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill={star <= confidence ? '#FFD166' : 'none'}
                        stroke="#FFD166"
                        strokeWidth="2"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-center mt-3" style={{ color: '#60A5FA' }}>
                  {confidence === 0 && 'Rate your confidence'}
                  {confidence === 1 && 'Not confident'}
                  {confidence === 2 && 'Slightly confident'}
                  {confidence === 3 && 'Somewhat confident'}
                  {confidence === 4 && 'Confident'}
                  {confidence === 5 && 'Very confident'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              fullWidth
              size="lg"
              isDisabled={!selectedAnswer || confidence === 0 || submitted}
              onClick={() => {
                if (selectedAnswer && confidence > 0 && !submitted) {
                  setSubmitted(true);
                  setIsCorrect(selectedAnswer === correctAnswer);
                }
              }}
              className="font-bold text-base h-16"
              style={{
                borderRadius: '50px',
                background: selectedAnswer && confidence > 0 && !submitted
                  ? 'rgba(241, 245, 249, 0.95)'
                  : 'rgba(71, 85, 105, 0.4)',
                backdropFilter: 'blur(8px)',
                color: selectedAnswer && confidence > 0 && !submitted ? '#0F172A' : '#94A3B8',
                boxShadow: selectedAnswer && confidence > 0 && !submitted
                  ? '0 6px 0 rgba(203, 213, 225, 0.8), 0 8px 24px rgba(241, 245, 249, 0.2)'
                  : 'none',
                border: '1px solid rgba(71, 85, 105, 0.3)',
              }}
            >
              {submitted ? (isCorrect ? '✓ Correct!' : '✗ Incorrect') : 'Submit Answer'}
            </Button>
          </CardBody>
        </Card>

        {/* Why This Next */}
        <Card style={{
          background: 'rgba(30, 41, 59, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(71, 85, 105, 0.3)',
        }}>
          <CardBody className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: '#374151' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v6m0 6v6M1 12h6m6 0h6"/>
                </svg>
              </div>
              <h3 className="font-bold text-base" style={{ color: '#F9FAFB' }}>Why This Question Next</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'θ̂', value: '0.67' },
                { label: 'SE', value: '0.12' },
                { label: 'Mastery', value: '0.82' },
                { label: 'Info', value: '1.45' },
                { label: 'Blueprint', value: '×1.2' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="px-3 py-2"
                  style={{
                    background: '#374151',
                    color: '#E5E7EB',
                    borderRadius: '12px',
                    border: '1px solid #4B5563',
                  }}
                >
                  <span className="font-mono font-semibold text-xs">{stat.label}={stat.value}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
