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
      <div className="relative min-h-screen overflow-hidden bg-surface-bg1 px-4 py-16 text-text-high">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--accent-trust-glow),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-6 text-center">
          <Mascot className="h-40 w-40 drop-shadow-[0_25px_45px_var(--accent-trust-glow)]" status={isProcessing ? 'happy' : 'default'} />
          <div className="max-w-2xl space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-text-high">Drop a file. Spark a lesson.</h1>
            <p className="text-lg text-text-med">
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
            className="w-full rounded-3xl bg-gradient-to-r from-brand-light via-brand-secondary to-semantic-info py-4 text-lg font-semibold text-text-high shadow-xl transition hover:from-brand-light/90 hover:via-brand-secondary/90 hover:to-semantic-info/90 disabled:cursor-not-allowed disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? '⚡ Queuing...' : '🚀 Send to Sparky'}
          </button>

          {error && (
            <div className="rounded-3xl bg-semantic-danger/10 border border-semantic-danger/30 p-4 text-center">
              <p className="text-sm text-semantic-danger">{error}</p>
            </div>
          )}
        </div>

        {/* Job Queue */}
        <JobQueuePanel jobs={(jobs as unknown) as any[]} showDevTools={process.env.NEXT_PUBLIC_DEV_UPLOAD === '1'} />
      </div>
    </div>
  );
}
