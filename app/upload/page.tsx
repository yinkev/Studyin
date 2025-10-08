'use client';

/**
 * Upload Page - Material Design 3 Edition
 * Document upload & processing with MD3 components
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
    <div style={{
      minHeight: '100vh',
      padding: '4rem 1rem',
      backgroundColor: 'var(--md-sys-color-surface)',
      color: 'var(--md-sys-color-on-surface)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        maxWidth: '72rem',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '3rem'
      }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          textAlign: 'center'
        }}>
          <div className="md3-elevation-3" style={{
            width: '6rem',
            height: '6rem',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--md-sys-color-on-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div style={{ maxWidth: '42rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h1 className="md3-display-medium" style={{
              fontWeight: 900,
              color: 'var(--md-sys-color-on-surface)'
            }}>
              Upload Your Content
            </h1>
            <p className="md3-body-large" style={{
              color: 'var(--md-sys-color-on-surface-variant)'
            }}>
              Upload documents and we'll transform them into interactive lessons with our adaptive content engine.
            </p>
          </div>
        </header>

        {/* Upload Zone */}
        <div style={{
          maxWidth: '48rem',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <DragDropZone onFileSelect={handleFileSelect} selectedFile={file} disabled={isProcessing} />

          <md-filled-button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            style={{
              width: '100%',
              fontSize: '1.125rem',
              padding: '1rem',
              '--md-filled-button-container-shape': '28px'
            }}
          >
            {isProcessing ? 'Processing...' : 'Process Document'}
          </md-filled-button>

          {error && (
            <div className="md3-surface-container md3-shape-large" style={{
              padding: '1rem',
              border: '2px solid var(--md-sys-color-error)',
              backgroundColor: 'var(--md-sys-color-error-container)',
              textAlign: 'center'
            }}>
              <p className="md3-body-small" style={{
                color: 'var(--md-sys-color-on-error-container)'
              }}>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Job Queue */}
        <JobQueuePanel jobs={(jobs as unknown) as any[]} showDevTools={process.env.NEXT_PUBLIC_DEV_UPLOAD === '1'} />
      </div>
    </div>
  );
}
