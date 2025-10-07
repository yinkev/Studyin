/**
 * NOVA - Improved UX
 * World-class header + User-friendly question explanation
 */

'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Chip, Avatar, Switch, Modal, ModalContent, ModalHeader, ModalBody, Badge, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';

export default function NovaImprovedPage() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);

  const correctAnswer = 'B';

  // Theme colors
  const theme = darkMode ? {
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
    headerBg: 'rgba(15, 23, 42, 0.8)',
    headerBorder: 'rgba(71, 85, 105, 0.3)',
    cardBg: 'rgba(30, 41, 59, 0.6)',
    cardBorder: 'rgba(71, 85, 105, 0.3)',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    answerBg: 'rgba(51, 65, 85, 0.5)',
    answerBorder: 'rgba(71, 85, 105, 0.4)',
    answerText: '#F1F5F9',
  } : {
    background: '#F5F5F5',
    headerBg: '#FFFFFF',
    headerBorder: '#E5E7EB',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    answerBg: '#F9FAFB',
    answerBorder: '#E5E7EB',
    answerText: '#374151',
  };

  return (
    <div className="min-h-screen transition-all duration-500" style={{
      background: theme.background,
    }}>
      {/* World-Class Header */}
      <header className="border-b" style={{
        background: theme.headerBg,
        backdropFilter: darkMode ? 'blur(12px)' : 'none',
        borderColor: theme.headerBorder,
      }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center relative"
              style={{
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                boxShadow: '0 4px 0 #1D4ED8, 0 6px 12px rgba(59, 130, 246, 0.3)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight" style={{
              color: theme.textPrimary,
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
            }}>
              Studyin
            </h1>
          </div>

          {/* Navigation with Icons */}
          <nav className="flex items-center gap-2">
            <Button
              variant="flat"
              color="primary"
              size="md"
              startContent={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              }
            >
              Study
            </Button>

            <Button
              variant="light"
              size="md"
              startContent={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              }
            >
              Upload
            </Button>

            <Button
              variant="light"
              size="md"
              startContent={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              }
            >
              Analytics
            </Button>

            <Button
              variant="light"
              size="md"
              startContent={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              }
            >
              Dashboard
            </Button>

            {/* Dark Mode Toggle */}
            <div className="flex items-center gap-2 ml-2 px-3 py-2 rounded-2xl transition-all" style={{
              background: darkMode ? 'rgba(51, 65, 85, 0.5)' : '#F3F4F6',
              border: darkMode ? '1px solid rgba(71, 85, 105, 0.4)' : '1px solid #E5E7EB',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#64748B' : '#F59E0B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <Switch
                size="sm"
                isSelected={darkMode}
                onValueChange={setDarkMode}
                aria-label="Dark mode"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#60A5FA' : '#64748B'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
          </nav>

          {/* User Section with Badge */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>Level 7</div>
              <div className="text-xs font-medium" style={{ color: theme.textSecondary }}>2,450 XP</div>
            </div>
            <Badge content="3" color="danger" size="sm">
              <Avatar
                className="w-10 h-10"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  border: darkMode ? '2px solid rgba(59, 130, 246, 0.3)' : '2px solid rgba(59, 130, 246, 0.2)',
                }}
              />
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Study Card */}
        <Card className="mb-6 transition-all duration-500" style={{
          background: theme.cardBg,
          backdropFilter: darkMode ? 'blur(20px)' : 'none',
          borderRadius: '40px',
          boxShadow: darkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 0 #D1D5DB, 0 12px 24px rgba(0, 0, 0, 0.08)',
          border: darkMode ? '1px solid rgba(71, 85, 105, 0.3)' : 'none',
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
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                }
              >
                Question 3 of 10
              </Chip>

              <h2 className="text-3xl font-bold mb-2 transition-colors" style={{
                color: theme.textPrimary,
                fontFamily: 'Space Grotesk, system-ui, sans-serif',
                letterSpacing: '-0.02em',
              }}>
                What is the primary mechanism of action for ACE inhibitors?
              </h2>
              <p className="text-sm transition-colors" style={{ color: theme.textSecondary }}>
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

                let backgroundColor = theme.answerBg;
                let borderColor = theme.answerBorder;
                let textColor = theme.answerText;
                let shadowColor = 'none';

                if (showFeedback) {
                  if (isThisCorrect) {
                    backgroundColor = darkMode ? 'rgba(16, 185, 129, 0.9)' : '#10B981';
                    borderColor = darkMode ? 'rgba(5, 150, 105, 0.5)' : 'none';
                    textColor = '#FFFFFF';
                    shadowColor = darkMode
                      ? '0 6px 0 #059669, 0 8px 24px rgba(16, 185, 129, 0.4)'
                      : '0 6px 0 #059669';
                  } else if (isSelected) {
                    backgroundColor = darkMode ? 'rgba(239, 68, 68, 0.9)' : '#EF4444';
                    borderColor = darkMode ? 'rgba(220, 38, 38, 0.5)' : 'none';
                    textColor = '#FFFFFF';
                    shadowColor = darkMode
                      ? '0 6px 0 #DC2626, 0 8px 24px rgba(239, 68, 68, 0.4)'
                      : '0 6px 0 #DC2626';
                  }
                } else if (isSelected) {
                  backgroundColor = darkMode ? 'rgba(59, 130, 246, 0.9)' : '#3B82F6';
                  borderColor = darkMode ? 'rgba(37, 99, 235, 0.5)' : 'none';
                  textColor = '#FFFFFF';
                  shadowColor = darkMode
                    ? '0 6px 0 #2563EB, 0 8px 24px rgba(59, 130, 246, 0.4)'
                    : '0 6px 0 #2563EB';
                }

                return (
                  <button
                    key={choice.id}
                    onClick={() => !submitted && setSelectedAnswer(choice.id)}
                    disabled={submitted}
                    className="w-full text-left p-5 transition-all duration-300"
                    style={{
                      borderRadius: '24px',
                      background: backgroundColor,
                      backdropFilter: darkMode ? 'blur(8px)' : 'none',
                      border: borderColor === 'none' ? 'none' : darkMode ? `1px solid ${borderColor}` : `2px solid ${borderColor}`,
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
              <div className="border-t pt-6 mb-6 transition-colors" style={{ borderColor: darkMode ? '#374151' : '#BAE6FD' }}>
                <p className="text-sm text-center mb-4 transition-colors" style={{ color: darkMode ? '#60A5FA' : '#0369A1' }}>
                  How confident are you in this answer?
                </p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setConfidence(star)}
                      className="transition-all hover:scale-110"
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
                <p className="text-xs text-center mt-3 transition-colors" style={{ color: darkMode ? '#60A5FA' : '#0369A1' }}>
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
              className="font-bold text-base h-16 transition-all duration-300"
              style={{
                borderRadius: '50px',
                background: selectedAnswer && confidence > 0 && !submitted
                  ? (darkMode ? 'rgba(241, 245, 249, 0.95)' : '#111827')
                  : (darkMode ? 'rgba(71, 85, 105, 0.4)' : '#E5E7EB'),
                backdropFilter: darkMode ? 'blur(8px)' : 'none',
                color: selectedAnswer && confidence > 0 && !submitted
                  ? (darkMode ? '#0F172A' : '#FFFFFF')
                  : (darkMode ? '#94A3B8' : '#9CA3AF'),
                boxShadow: selectedAnswer && confidence > 0 && !submitted
                  ? (darkMode ? '0 6px 0 rgba(203, 213, 225, 0.8), 0 8px 24px rgba(241, 245, 249, 0.2)' : '0 6px 0 #030712')
                  : 'none',
                border: darkMode ? '1px solid rgba(71, 85, 105, 0.3)' : 'none',
              }}
            >
              {submitted ? (isCorrect ? '✓ Correct!' : '✗ Incorrect') : 'Submit Answer'}
            </Button>
          </CardBody>
        </Card>

        {/* Why This Question - User Friendly */}
        <Card className="transition-all duration-500" style={{
          background: theme.cardBg,
          backdropFilter: darkMode ? 'blur(20px)' : 'none',
          borderRadius: '28px',
          boxShadow: darkMode
            ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 4px 0 #E5E7EB, 0 8px 16px rgba(0, 0, 0, 0.06)',
          border: darkMode ? '1px solid rgba(71, 85, 105, 0.3)' : 'none',
        }}>
          <CardBody className="p-6">
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
                onPress={() => setShowMathModal(true)}
                endContent={
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
                    Your estimated ability is <strong>Level 7 (82% mastery)</strong>. This question matches your current knowledge.
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
                    This question will give us <strong>1.45x more insight</strong> into what you know compared to random selection.
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
                    This topic appears <strong>1.2x more often</strong> in your target exam blueprint.
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </main>

      {/* Math Explanation Modal */}
      <Modal
        isOpen={showMathModal}
        onClose={() => setShowMathModal(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{
          background: theme.cardBg,
          backdropFilter: darkMode ? 'blur(20px)' : 'none',
          border: darkMode ? '1px solid rgba(71, 85, 105, 0.3)' : 'none',
        }}>
          <ModalHeader style={{ color: theme.textPrimary }}>
            <div className="flex items-center gap-3">
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
          </ModalHeader>
          <ModalBody className="pb-6">
            <div className="space-y-6" style={{ color: theme.textSecondary }}>
              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>📊 Your Ability Estimate (θ̂ = 0.67)</h4>
                <p className="text-sm mb-2">
                  Based on your past performance, we estimate your knowledge level is <strong>0.67</strong> on a scale from -3 to +3.
                </p>
                <p className="text-xs">
                  ✓ You're performing better than 75% of learners<br/>
                  ✓ Equivalent to ~82% average mastery
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
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>💡 Information Value (Info = 1.45)</h4>
                <p className="text-sm mb-2">
                  This question provides <strong>1.45x more information</strong> than a random question.
                </p>
                <p className="text-xs">
                  ✓ Higher = better at revealing what you know<br/>
                  ✓ Questions near your ability level = most informative
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-2" style={{ color: theme.textPrimary }}>📋 Blueprint Weight (×1.2)</h4>
                <p className="text-sm mb-2">
                  This topic appears <strong>20% more often</strong> in your target exam.
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
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
