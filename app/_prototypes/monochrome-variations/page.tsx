/**
 * Monochrome Pop - Style Variations
 * Different takes on the gray + accent theme
 */

'use client';

import { useState } from 'react';

export default function MonochromeVariationsPage() {
  const [selected, setSelected] = useState('B');

  return (
    <div className="min-h-screen p-8" style={{ background: '#f5f5f5' }}>
      <h1 className="text-4xl font-bold mb-8 text-center">Monochrome Pop - Style Variations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

        {/* Variation 1: Current (Chunky Shadows) */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">1: Chunky Shadows (Current)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #D1D5DB, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                    { text: 'Vasodilate smooth muscle', selected: false },
                    { text: 'Block beta-1 receptors', selected: false },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#F9FAFB',
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: ans.selected ? '#FFFFFF' : '#374151',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? 'none' : '2px solid #E5E7EB',
                      boxShadow: ans.selected ? '0 6px 0 #2563EB' : 'none',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: '#111827',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 6px 0 #030712',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 2: Soft Shadows (Floating) */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">2: Soft Shadows (Floating)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '32px',
                padding: '32px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                    { text: 'Vasodilate smooth muscle', selected: false },
                    { text: 'Block beta-1 receptors', selected: false },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#F9FAFB',
                      borderRadius: '20px',
                      padding: '20px 24px',
                      color: ans.selected ? '#FFFFFF' : '#374151',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: 'none',
                      boxShadow: ans.selected ? '0 8px 16px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.05)',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: '#111827',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 3: Border Focus */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">3: Border Focus (Outlined)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '32px',
                padding: '32px',
                border: '3px solid #E5E7EB',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                    { text: 'Vasodilate smooth muscle', selected: false },
                    { text: 'Block beta-1 receptors', selected: false },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px 24px',
                      color: ans.selected ? '#FFFFFF' : '#374151',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? '3px solid #2563EB' : '3px solid #E5E7EB',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: '#111827',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: '3px solid #030712',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 4: Flat Minimal */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">4: Flat Minimal (No Shadows)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '32px',
                border: '2px solid #E5E7EB',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                    { text: 'Vasodilate smooth muscle', selected: false },
                    { text: 'Block beta-1 receptors', selected: false },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#F9FAFB',
                      borderRadius: '12px',
                      padding: '20px 24px',
                      color: ans.selected ? '#FFFFFF' : '#374151',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: 'none',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: '#111827',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 5: Color Accent Variety */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">5: Different Accent Colors</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #D1D5DB, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '24px',
                }}>
                  Try different accent colors
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { name: 'Blue', color: '#3B82F6', shadow: '#2563EB' },
                    { name: 'Purple', color: '#8B5CF6', shadow: '#7C3AED' },
                    { name: 'Cyan', color: '#06B6D4', shadow: '#0891B2' },
                    { name: 'Green', color: '#10B981', shadow: '#059669' },
                  ].map((accent, i) => (
                    <div key={i} style={{
                      background: accent.color,
                      borderRadius: '16px',
                      padding: '16px',
                      color: '#FFFFFF',
                      fontWeight: '600',
                      fontSize: '14px',
                      boxShadow: `0 4px 0 ${accent.shadow}`,
                      textAlign: 'center',
                    }}>
                      {accent.name}
                    </div>
                  ))}
                </div>

                <div className="text-xs text-center" style={{ color: '#9CA3AF' }}>
                  Choose your primary accent color
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 6: Typography Weight */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">6: Typography Variations</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #D1D5DB, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                {/* Extra Bold */}
                <div style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  marginBottom: '4px',
                  color: '#111827',
                  letterSpacing: '-0.03em',
                }}>
                  Extra Bold (900)
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px',
                }}>
                  Super punchy and modern
                </div>

                <hr style={{ border: 'none', borderTop: '2px solid #F3F4F6', margin: '16px 0' }} />

                {/* Bold */}
                <div style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '4px',
                  color: '#111827',
                }}>
                  Bold (700)
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px',
                }}>
                  Current - balanced
                </div>

                <hr style={{ border: 'none', borderTop: '2px solid #F3F4F6', margin: '16px 0' }} />

                {/* Semi-Bold */}
                <div style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  marginBottom: '4px',
                  color: '#111827',
                }}>
                  Semi-Bold (600)
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px',
                }}>
                  Lighter, more elegant
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 7: Spacing Variations */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">7: Spacing (Tight vs Airy)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#F5F5F5',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '48px',
                boxShadow: '0 4px 0 #D1D5DB, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '16px',
                  color: '#111827',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '32px',
                }}>
                  Airy spacing - more breathing room
                </div>

                <div className="space-y-4">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#F9FAFB',
                      borderRadius: '24px',
                      padding: '24px 28px',
                      color: ans.selected ? '#FFFFFF' : '#374151',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? 'none' : '2px solid #E5E7EB',
                      boxShadow: ans.selected ? '0 6px 0 #2563EB' : 'none',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Variation 8: Dark Mode */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">8: Dark Mode</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-700" style={{ height: '600px' }}>
            <div style={{
              background: '#1F2937',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#111827',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #000000, 0 12px 24px rgba(0, 0, 0, 0.4)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#F9FAFB',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#9CA3AF',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', selected: false },
                    { text: 'Inhibit angiotensin conversion', selected: true },
                    { text: 'Vasodilate smooth muscle', selected: false },
                    { text: 'Block beta-1 receptors', selected: false },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.selected ? '#3B82F6' : '#374151',
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: '#F9FAFB',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? 'none' : '2px solid #4B5563',
                      boxShadow: ans.selected ? '0 6px 0 #2563EB' : 'none',
                    }}>
                      {ans.text}
                    </div>
                  ))}
                </div>

                <button style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '20px',
                  borderRadius: '50px',
                  background: '#F9FAFB',
                  color: '#111827',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 6px 0 #D1D5DB',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
