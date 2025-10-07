/**
 * Playful Rounded - Modern Variations
 * No gradients, clean and contemporary
 */

'use client';

export default function PlayfulOptionsPage() {
  return (
    <div className="min-h-screen p-8" style={{ background: '#f5f5f5' }}>
      <h1 className="text-4xl font-bold mb-8 text-center">Playful Rounded - Modern Variations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

        {/* Variation A: Soft Neutral */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">A: Soft Neutral (Beige/Cream)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#FAF7F2',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #E8E3DA, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#2D2D2D',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#8B8B8B',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', bg: '#FAF7F2', border: '#E8E3DA' },
                    { text: 'Inhibit angiotensin conversion', bg: '#FFE8D6', border: '#FFCB9A', selected: true },
                    { text: 'Vasodilate smooth muscle', bg: '#FAF7F2', border: '#E8E3DA' },
                    { text: 'Block beta-1 receptors', bg: '#FAF7F2', border: '#E8E3DA' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.bg,
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: '#2D2D2D',
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? `3px solid ${ans.border}` : '2px solid #E8E3DA',
                      boxShadow: ans.selected ? '0 4px 0 #FFCB9A' : 'none',
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
                  background: '#FF9F66',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 6px 0 #E67E3C',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation B: Monochrome Pop */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">B: Monochrome Pop (Gray + Accent)</h2>
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

        {/* Variation C: Pastel Modern */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">C: Pastel Modern (Clean Colors)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#FAFAFA',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #E0E0E0, 0 12px 24px rgba(0, 0, 0, 0.06)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#1F2937',
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
                    { text: 'Block aldosterone receptors', bg: '#FEF3C7', color: '#92400E' },
                    { text: 'Inhibit angiotensin conversion', bg: '#A7F3D0', color: '#065F46', selected: true },
                    { text: 'Vasodilate smooth muscle', bg: '#DBEAFE', color: '#1E40AF' },
                    { text: 'Block beta-1 receptors', bg: '#FED7E2', color: '#9F1239' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.bg,
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: ans.color,
                      fontWeight: '600',
                      fontSize: '15px',
                      border: ans.selected ? `3px solid ${ans.color}` : 'none',
                      boxShadow: ans.selected ? `0 6px 0 ${ans.color}40` : 'none',
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
                  background: '#10B981',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 6px 0 #059669',
                }}>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Variation D: Bold Solid */}
        <div className="relative">
          <h2 className="text-xl font-bold mb-4">D: Bold Solid (Vibrant Blocks)</h2>
          <div className="rounded-2xl overflow-hidden border-4 border-gray-300" style={{ height: '600px' }}>
            <div style={{
              background: '#FFFFFF',
              minHeight: '600px',
              padding: '32px',
            }}>
              <div style={{
                background: '#F8FAFC',
                borderRadius: '40px',
                padding: '32px',
                boxShadow: '0 4px 0 #CBD5E1, 0 12px 24px rgba(0, 0, 0, 0.08)',
              }}>
                <div style={{
                  fontSize: '26px',
                  fontWeight: '800',
                  marginBottom: '8px',
                  color: '#0F172A',
                }}>
                  What is ACE inhibitor?
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#64748B',
                  marginBottom: '24px',
                }}>
                  Select the most accurate answer
                </div>

                <div className="space-y-3">
                  {[
                    { text: 'Block aldosterone receptors', bg: '#FFFFFF', border: '#E2E8F0' },
                    { text: 'Inhibit angiotensin conversion', bg: '#06B6D4', border: '#06B6D4', selected: true },
                    { text: 'Vasodilate smooth muscle', bg: '#FFFFFF', border: '#E2E8F0' },
                    { text: 'Block beta-1 receptors', bg: '#FFFFFF', border: '#E2E8F0' },
                  ].map((ans, i) => (
                    <div key={i} style={{
                      background: ans.bg,
                      borderRadius: '24px',
                      padding: '20px 24px',
                      color: ans.selected ? '#FFFFFF' : '#334155',
                      fontWeight: '700',
                      fontSize: '15px',
                      border: `3px solid ${ans.border}`,
                      boxShadow: ans.selected ? '0 6px 0 #0891B2' : 'none',
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
                  background: '#0F172A',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '16px',
                  border: 'none',
                  boxShadow: '0 6px 0 #020617',
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
