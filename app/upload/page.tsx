'use client';

/**
 * Upload Page — PHASE 4 — MAX GRAPHICS MODE
 * Features:
 * - Drag & drop file upload with animations
 * - Real-time CLI progress tracking (Gemini OCR → Codex MCQ)
 * - Job queue management with status badges
 * - Job history with filters and retry actions
 */

import Mascot from '../../components/Mascot';
import { DragDropZone } from '../../components/upload/DragDropZone';
import { JobQueuePanel } from '../../components/upload/JobQueuePanel';
import { useUploader } from '../../lib/hooks/useUploader';

export default function UploadPage() {
  const { file, setFile, jobs, error, isProcessing, enqueueUpload } = useUploader();

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    await enqueueUpload();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-16 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-6 text-center">
          <Mascot className="h-40 w-40 drop-shadow-[0_25px_45px_rgba(56,189,248,0.35)]" status={isProcessing ? 'happy' : 'default'} />
          <div className="max-w-2xl space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-white">Drop a file. Spark a lesson.</h1>
            <p className="text-lg text-slate-200">
              Sparky runs your upload through our adaptive content engine. We queue the heavy lifting, so you stay in the flow.
            </p>
          </div>
        </header>

        {/* Upload Zone */}
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <DragDropZone onFileSelect={handleFileSelect} selectedFile={file} disabled={isProcessing} />

          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="w-full rounded-3xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 py-4 text-lg font-semibold text-white shadow-xl transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? '⚡ Queuing...' : '🚀 Send to Sparky'}
          </button>

          {error && (
            <div className="rounded-3xl bg-rose-500/20 border border-rose-500/30 p-4 text-center">
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}
        </div>

        {/* Job Queue */}
        <JobQueuePanel jobs={(jobs as unknown) as any[]} showDevTools={process.env.NEXT_PUBLIC_DEV_UPLOAD === '1'} />
      </div>
    </div>
  );
}
