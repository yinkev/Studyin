/**
 * Design Options Preview
 * Shows 4 different design directions side by side
 */

'use client';

import { Card, CardBody, Button, Chip } from '@heroui/react';

export default function DesignOptionsPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#f5f5f5' }}>
      <h1 className="text-4xl font-bold mb-8 text-center">Design Options</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

        {/* Option 1: Glassmorphism Dark */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">Option 1: Glassmorphism Dark</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 50%, #0A0E27 100%)',
              minHeight: '600px',
              padding: '32px',
            }}>
              {/* Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                }}>
                  What is ACE inhibitor?
                </div>

                {/* Answer choices */}
                <div className="space-y-3">
                  {['Answer A', 'Answer B', 'Answer C'].map((ans, i) => (
                    <div key={i} style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '16px',
                      padding: '16px',
                      color: '#E0E7FF',
                      boxShadow: i === 1 ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none',
                    }}>
                      {ans}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  border: 'none',
                  boxShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
                }}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Option 2: Minimalist Brutalist */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">Option 2: Minimalist Brutalist</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#FFFFFF',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                border: '4px solid #000000',
                borderRadius: '0px',
                padding: '24px',
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  marginBottom: '24px',
                  color: '#000000',
                  letterSpacing: '-0.02em',
                }}>
                  What is ACE inhibitor?
                </div>

                <div className="space-y-4">
                  {[
                    { text: 'Answer A', color: '#FF6B6B' },
                    { text: 'Answer B', color: '#4ECDC4' },
                    { text: 'Answer C', color: '#FFE66D' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: i === 1 ? ans.color : '#F8F9FA',
                      border: '3px solid #000000',
                      padding: '16px 20px',
                      color: i === 1 ? '#FFFFFF' : '#000000',
                      fontWeight: '700',
                      fontSize: '16px',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '18px',
                  background: '#000000',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  border: 'none',
                  letterSpacing: '0.05em',
                }}>
                  SUBMIT →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Option 3: Playful Rounded */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">Option 3: Playful Rounded</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #FFF5E6 0%, #FFE8F0 50%, #E6F3FF 100%)',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 8px 0 rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '24px',
                  color: '#2D3748',
                  lineHeight: '1.3',
                }}>
                  What is ACE inhibitor? 🤔
                </div>

                <div className="space-y-4">
                  {[
                    { text: 'Answer A', color: '#FF8E8E', emoji: '🅰️' },
                    { text: 'Answer B', color: '#8ED6FF', emoji: '🅱️' },
                    { text: 'Answer C', color: '#FFD88E', emoji: '©️' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: i === 1 ? ans.color : '#F7FAFC',
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: '#2D3748',
                      fontWeight: '600',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: i === 1 ? '3px solid #5B9CFF' : 'none',
                    }}>
                      <span style={{ fontSize: '24px' }}>{ans.emoji}</span>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '18px',
                  border: 'none',
                  boxShadow: '0 6px 0 rgba(102, 126, 234, 0.3)',
                }}>
                  Submit Answer ✨
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Option 4: Professional Gradient */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">Option 4: Professional Gradient</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
              }}>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  color: '#1E293B',
                  lineHeight: '1.4',
                }}>
                  What is the primary mechanism of ACE inhibitors?
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Answer A', gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
                    { text: 'Answer B', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', selected: true },
                    { text: 'Answer C', gradient: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.gradient,
                      borderRadius: '12px',
                      padding: '18px 20px',
                      color: ans.selected ? '#FFFFFF' : '#475569',
                      fontWeight: '500',
                      fontSize: '15px',
                      border: ans.selected ? 'none' : '1px solid #E2E8F0',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0891B2 100%)',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)',
                }}>
                  Continue →
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
