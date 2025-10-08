'use client';

/**
 * CLI Progress Display — MAX GRAPHICS MODE
 * Real-time visualization of worker CLI pipeline
 * Shows Gemini OCR → LO extraction → Codex MCQ generation → Validation
 */

import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion/react';

export type CLIStep = 'init' | 'ocr' | 'lo-extraction' | 'mcq-generation' | 'validation' | 'refinement' | 'saving' | 'complete';

export interface CLIProgress {
  step: CLIStep;
  progress: number; // 0-100
  message: string;
  timestamp: number;
}

interface CLIProgressDisplayProps {
  jobId: string;
  fileName: string;
  progress: CLIProgress | null;
  isProcessing: boolean;
}

const STEP_CONFIG: Record<CLIStep, { icon: string; label: string; color: string; target: number }> = {
  init: { icon: '🚀', label: 'Initializing', color: 'var(--text-low)', target: 0 },
  ocr: { icon: '👁️', label: 'Gemini OCR', color: 'var(--brand-light)', target: 30 },
  'lo-extraction': { icon: '🎯', label: 'Extract LOs', color: 'var(--semantic-success)', target: 50 },
  'mcq-generation': { icon: '✍️', label: 'Generate MCQs', color: 'var(--semantic-warning)', target: 70 },
  validation: { icon: '✅', label: 'Validate', color: 'var(--viz-mastery-high)', target: 85 },
  refinement: { icon: '🔧', label: 'Refine', color: 'var(--semantic-danger)', target: 95 },
  saving: { icon: '💾', label: 'Saving', color: 'var(--semantic-success)', target: 99 },
  complete: { icon: '🎉', label: 'Complete', color: 'var(--semantic-success)', target: 100 },
};

export function CLIProgressDisplay({
  jobId,
  fileName,
  progress,
  isProcessing,
}: CLIProgressDisplayProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);

  const currentStep = progress?.step || 'init';
  const currentProgress = progress?.progress || 0;
  const stepConfig = STEP_CONFIG[currentStep];

  // Add log entry when progress updates
  useEffect(() => {
    if (progress && progress.message) {
      setLogs((prev) => [
        ...prev,
        `[${new Date(progress.timestamp).toLocaleTimeString()}] ${progress.message}`,
      ]);
    }
  }, [progress?.timestamp]);

  // Animate progress bar
  useEffect(() => {
    if (progressBarRef.current && isProcessing) {
      animate(progressBarRef.current, { width: `${currentProgress}%` }, { duration: 0.8, easing: [0.19, 1, 0.22, 1] });
    }
  }, [currentProgress, isProcessing]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glow-card p-6 rounded-3xl bg-surface-bg0/70 border border-text-low/15">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-text-high">{fileName}</h3>
          <p className="text-xs text-text-med font-mono">{jobId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{stepConfig.icon}</span>
          <span className="text-sm font-semibold text-text-high">{stepConfig.label}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full h-4 bg-surface-bg2 rounded-full overflow-hidden relative">
          <div
            ref={progressBarRef}
            className="h-full rounded-full transition-all"
            style={{
              width: `${currentProgress}%`,
              background: `linear-gradient(90deg, ${stepConfig.color}, ${stepConfig.color}cc)`,
              boxShadow: `0 0 20px ${stepConfig.color}80`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs">
          <span className="text-text-med">{progress?.message || 'Waiting...'}</span>
          <span className="text-text-high font-mono font-bold">{currentProgress}%</span>
        </div>
      </div>

      {/* Step Timeline */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {Object.entries(STEP_CONFIG).map(([step, config]) => {
          const stepIndex = Object.keys(STEP_CONFIG).indexOf(step);
          const currentStepIndex = Object.keys(STEP_CONFIG).indexOf(currentStep);
          const isActive = stepIndex === currentStepIndex;
          const isComplete = stepIndex < currentStepIndex;

          return (
            <div
              key={step}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-surface-bg0/80 border-2 scale-105'
                  : isComplete
                  ? 'bg-surface-bg0/50'
                  : 'bg-surface-bg2/50'
              }`}
              style={{
                borderColor: isActive ? config.color : 'transparent',
              }}
            >
              <span className={`text-2xl mb-1 ${isActive ? 'animate-bounce' : ''}`}>
                {isComplete ? '✓' : config.icon}
              </span>
              <span className="text-[10px] text-center text-text-med">{config.label}</span>
            </div>
          );
        })}
      </div>

      {/* CLI Logs */}
      <div className="rounded-2xl bg-surface-bg2 border border-text-low/15 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-text-med">CLI Output</div>
          <div className="text-xs text-text-low">{logs.length} lines</div>
        </div>
        <div
          ref={logsRef}
          className="h-32 overflow-y-auto font-mono text-xs text-text-high space-y-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--text-low) var(--surface-bg2)',
          }}
        >
          {logs.length === 0 ? (
            <div className="text-text-low italic">Waiting for CLI output...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="hover:bg-surface-bg0/40 px-2 py-1 rounded">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Footer */}
      {isProcessing && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-med">
          <div className="w-2 h-2 rounded-full bg-brand-light animate-pulse" />
          Processing with Gemini + Codex CLI...
        </div>
      )}
    </div>
  );
}
