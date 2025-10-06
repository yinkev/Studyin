'use client';

import { ChangeEvent } from 'react';
import Mascot from '../../components/Mascot';
import GlowCard from '../../components/atoms/GlowCard';
import { useUploader } from '../../lib/hooks/useUploader';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function UploadPage() {
  const { file, setFile, jobs, error, isProcessing, enqueueUpload } = useUploader();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    await enqueueUpload();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <header className="flex flex-col items-center gap-6 text-center">
          <Mascot className="h-40 w-40 drop-shadow-[0_25px_45px_rgba(56,189,248,0.35)]" status={isProcessing ? 'happy' : 'default'} />
          <div className="max-w-2xl space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-white">Drop a file. Spark a lesson.</h1>
            <p className="text-lg text-slate-200">
              Sparky runs your upload through our adaptive content engine. We queue the heavy lifting, so you stay in the flow.
            </p>
          </div>
        </header>

        <GlowCard className="mx-auto w-full max-w-3xl border border-white/20 bg-white/10 p-10 text-slate-900 shadow-[0_0_60px_rgba(14,165,233,0.25)]">
          <label
            htmlFor="upload-input"
            className="flex h-56 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/40 bg-white/50 p-8 text-center transition hover:border-sky-400 hover:bg-white/70"
          >
            <svg className="h-16 w-16 text-sky-500" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l7.5-7.5L18 15m-7.5-7.5V21" />
            </svg>
            <p className="mt-4 text-xl font-semibold text-slate-800">
              {file ? file.name : 'Click to upload or drag & drop'}
            </p>
            <p className="mt-2 text-sm text-slate-500">PDF • PPT • DOCX • Markdown</p>
            <input id="upload-input" type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="mt-8 w-full rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 py-4 text-lg font-semibold text-white shadow-xl transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Queuing...' : 'Send to Sparky'}
          </button>
          {error && <p className="mt-3 text-center text-sm text-rose-500">{error}</p>}
        </GlowCard>

        {jobs.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Activity</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <GlowCard key={job.id} className="border border-white/10 bg-white/10 p-6 text-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-300">{formatBytes(job.fileSize)}</p>
                      <h3 className="text-lg font-semibold text-white">{job.fileName}</h3>
                    </div>
                    <span
                      className={`rounded-full px-4 py-1 text-sm font-semibold ${
                        job.status === 'ready'
                          ? 'bg-emerald-500/90 text-white'
                          : job.status === 'failed'
                          ? 'bg-rose-500/90 text-white'
                          : 'bg-sky-500/80 text-white'
                      }`}
                    >
                      {job.status === 'queued' && 'Queued'}
                      {job.status === 'processing' && 'Processing'}
                      {job.status === 'ready' && 'Ready'}
                      {job.status === 'failed' && 'Failed'}
                    </span>
                  </div>
                  {job.lesson && (
                    <div className="mt-4 space-y-1 text-sm text-slate-200">
                      <p className="font-semibold text-white">{job.lesson.title}</p>
                      <p className="text-slate-300">{job.lesson.summary}</p>
                    </div>
                  )}
                  {job.localPath && process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' && (
                    <div className="mt-4">
                      <a
                        href={`studyin-cli://process?file=${encodeURIComponent(job.localPath)}`}
                        className="inline-flex items-center rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                      >
                        Process via CLI
                      </a>
                    </div>
                  )}
                  {job.error && <p className="mt-2 text-sm text-rose-300">{job.error}</p>}
                </GlowCard>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
