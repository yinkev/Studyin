'use client';

/**
 * Upload Page - Document Upload & Processing
 * Features:
 * - Drag & drop file upload with animations
 * - Real-time CLI progress tracking (Gemini OCR → Codex MCQ)
 * - Job queue management with status badges
 * - Job history with filters and retry actions
 */

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
      <div className="relative min-h-screen overflow-hidden px-4 py-16 text-text-high">
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-5xl font-black tracking-tight text-text-high">Upload Your Content</h1>
            <p className="text-lg text-text-med">
              Upload documents and we'll transform them into interactive lessons with our adaptive content engine.
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
            {isProcessing ? 'Processing...' : 'Process Document'}
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
