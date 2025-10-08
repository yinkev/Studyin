'use client';

/**
 * Job Queue Panel — MAX GRAPHICS MODE
 * Displays active jobs with real-time status updates
 * Shows queued, processing, ready, failed states
 */

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'motion/react';
import GlowCard from '../atoms/GlowCard';
import { CLIProgressDisplay, type CLIProgress } from './CLIProgressDisplay';

export interface Job {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  queuedAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  lesson?: {
    title: string;
    summary: string;
    lo_id: string;
  };
  localPath?: string;
  progress?: CLIProgress;
}

interface JobQueuePanelProps {
  jobs: Job[];
  onRetry?: (jobId: string) => void;
  onCancel?: (jobId: string) => void;
  showDevTools?: boolean;
}

export function JobQueuePanel({ jobs, onRetry, onCancel, showDevTools = false }: JobQueuePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Animate panel entrance
  useEffect(() => {
    if (panelRef.current && jobs.length > 0) {
      const cards = panelRef.current.querySelectorAll('.job-card');
      // @ts-expect-error NodeList animation is supported by Motion at runtime
      animate(cards, { opacity: [0, 1], y: [20, 0] }, {
        duration: 0.6,
        delay: stagger(0.1),
        easing: [0.19, 1, 0.22, 1],
      });
    }
  }, [jobs.length]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (startMs: number, endMs?: number): string => {
    const duration = (endMs || Date.now()) - startMs;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getStatusBadge = (status: Job['status']) => {
    const badges = {
      queued: { bg: 'bg-text-low/30 text-text-high', text: 'Queued', icon: '⏳' },
      processing: { bg: 'bg-brand-light/20 text-brand-light', text: 'Processing', icon: '⚡' },
      ready: { bg: 'bg-semantic-success/20 text-semantic-success', text: 'Ready', icon: '✅' },
      failed: { bg: 'bg-semantic-danger/20 text-semantic-danger', text: 'Failed', icon: '❌' },
    };
    const badge = badges[status];
    return (
      <span className={`${badge.bg} rounded-full px-4 py-1 text-sm font-semibold flex items-center gap-2`}>
        <span>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  if (jobs.length === 0) {
    return null;
  }

  const activeJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const completedJobs = jobs.filter((j) => j.status === 'ready' || j.status === 'failed');

  return (
    <div ref={panelRef} className="space-y-6">
      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-high mb-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-brand-light animate-pulse" />
            Active Jobs ({activeJobs.length})
          </h2>
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="job-card">
                {job.status === 'processing' && job.progress ? (
                  <CLIProgressDisplay
                    jobId={job.id}
                    fileName={job.fileName}
                    progress={job.progress}
                    isProcessing={true}
                  />
                ) : (
                  <GlowCard className="border border-text-low/15 bg-surface-bg0/70 p-6 text-text-high">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-text-med">{formatBytes(job.fileSize)}</p>
                        <h3 className="text-lg font-semibold text-text-high">{job.fileName}</h3>
                        <p className="text-xs text-text-med font-mono mt-1">Job ID: {job.id}</p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    {job.startedAt && (
                      <div className="mt-3 text-xs text-text-med">
                        Processing for {formatDuration(job.startedAt)}
                      </div>
                    )}
                  </GlowCard>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-text-high mb-4">
            History ({completedJobs.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedJobs.map((job) => (
              <GlowCard
                key={job.id}
                className={`job-card border p-6 text-text-high ${
                  job.status === 'ready'
                    ? 'border-semantic-success/30 bg-semantic-success/10'
                    : 'border-semantic-danger/30 bg-semantic-danger/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-wide text-text-med">{formatBytes(job.fileSize)}</p>
                    <h3 className="text-lg font-semibold text-text-high">{job.fileName}</h3>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {job.lesson && (
                  <div className="mt-4 space-y-1 text-sm text-text-high">
                    <p className="font-semibold text-text-high">{job.lesson.title}</p>
                    <p className="text-text-med">{job.lesson.summary}</p>
                    <p className="text-xs text-text-med font-mono">LO: {job.lesson.lo_id}</p>
                  </div>
                )}

                {job.error && (
                  <div className="mt-3 rounded-2xl bg-semantic-danger/10 border border-semantic-danger/30 p-3">
                    <p className="text-sm text-semantic-danger">{job.error}</p>
                  </div>
                )}

                {job.completedAt && (
                  <div className="mt-3 text-xs text-text-med">
                    Completed in {formatDuration(job.startedAt || job.queuedAt, job.completedAt)}
                  </div>
                )}

                {/* Dev Tools */}
                {showDevTools && job.localPath && process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' && (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`studyin-cli://process?file=${encodeURIComponent(job.localPath)}`}
                      className="inline-flex items-center rounded-2xl bg-surface-bg0/80 px-4 py-2 text-sm font-semibold text-text-high hover:bg-surface-bg0/60"
                    >
                      🔧 Process via CLI
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {job.status === 'failed' && onRetry && (
                    <button
                      onClick={() => onRetry(job.id)}
                      className="flex-1 rounded-2xl bg-brand-light px-4 py-2 text-sm font-semibold text-text-high hover:bg-brand-light/90 transition-colors"
                    >
                      🔄 Retry
                    </button>
                  )}
                  {job.status === 'ready' && job.lesson && (
                    <a
                      href={`/study?lesson=${job.lesson.lo_id}`}
                      className="flex-1 text-center rounded-2xl bg-semantic-success px-4 py-2 text-sm font-semibold text-text-high hover:bg-semantic-success/90 transition-colors"
                    >
                      📚 Start Lesson
                    </a>
                  )}
                  {onCancel && job.status !== 'ready' && (
                    <button
                      onClick={() => onCancel(job.id)}
                      className="rounded-2xl bg-semantic-danger/10 px-4 py-2 text-sm font-semibold text-semantic-danger hover:bg-semantic-danger/20 transition-colors"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
