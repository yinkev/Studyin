'use client';

/**
 * Job Queue Panel — MAX GRAPHICS MODE
 * Displays active jobs with real-time status updates
 * Shows queued, processing, ready, failed states
 */

import { useEffect, useRef } from 'react';
import { animate as anime } from "animejs";
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
      anime({
        targets: cards,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 600,
        delay: (anime as any).stagger ? (anime as any).stagger(100) : 0,
        ease: 'easeOutExpo',
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
      queued: { bg: 'bg-slate-500/90', text: 'Queued', icon: '⏳' },
      processing: { bg: 'bg-sky-500/80', text: 'Processing', icon: '⚡' },
      ready: { bg: 'bg-emerald-500/90', text: 'Ready', icon: '✅' },
      failed: { bg: 'bg-rose-500/90', text: 'Failed', icon: '❌' },
    };
    const badge = badges[status];
    return (
      <span className={`${badge.bg} rounded-full px-4 py-1 text-sm font-semibold text-white flex items-center gap-2`}>
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
          <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-sky-400 animate-pulse" />
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
                  <GlowCard className="border border-white/10 bg-white/10 p-6 text-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-slate-300">{formatBytes(job.fileSize)}</p>
                        <h3 className="text-lg font-semibold text-white">{job.fileName}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">Job ID: {job.id}</p>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    {job.startedAt && (
                      <div className="mt-3 text-xs text-slate-400">
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
          <h2 className="text-2xl font-bold text-slate-100 mb-4">
            History ({completedJobs.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedJobs.map((job) => (
              <GlowCard
                key={job.id}
                className={`job-card border p-6 text-slate-100 ${
                  job.status === 'ready'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-rose-500/30 bg-rose-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm uppercase tracking-wide text-slate-300">{formatBytes(job.fileSize)}</p>
                    <h3 className="text-lg font-semibold text-white">{job.fileName}</h3>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                {job.lesson && (
                  <div className="mt-4 space-y-1 text-sm text-slate-200">
                    <p className="font-semibold text-white">{job.lesson.title}</p>
                    <p className="text-slate-300">{job.lesson.summary}</p>
                    <p className="text-xs text-slate-400 font-mono">LO: {job.lesson.lo_id}</p>
                  </div>
                )}

                {job.error && (
                  <div className="mt-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 p-3">
                    <p className="text-sm text-rose-300">{job.error}</p>
                  </div>
                )}

                {job.completedAt && (
                  <div className="mt-3 text-xs text-slate-400">
                    Completed in {formatDuration(job.startedAt || job.queuedAt, job.completedAt)}
                  </div>
                )}

                {/* Dev Tools */}
                {showDevTools && job.localPath && process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' && (
                  <div className="mt-4 flex gap-2">
                    <a
                      href={`studyin-cli://process?file=${encodeURIComponent(job.localPath)}`}
                      className="inline-flex items-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
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
                      className="flex-1 rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 transition-colors"
                    >
                      🔄 Retry
                    </button>
                  )}
                  {job.status === 'ready' && job.lesson && (
                    <a
                      href={`/study?lesson=${job.lesson.lo_id}`}
                      className="flex-1 text-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                    >
                      📚 Start Lesson
                    </a>
                  )}
                  {onCancel && job.status !== 'ready' && (
                    <button
                      onClick={() => onCancel(job.id)}
                      className="rounded-2xl bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/30 transition-colors"
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
