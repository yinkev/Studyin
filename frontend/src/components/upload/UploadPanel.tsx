import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api/client';

interface MaterialSummary {
  id: string;
  filename: string;
  size: number;
  type: string;
  status: string;
  chunk_count: number;
  uploaded_at?: string | null;
}

interface UploadPanelProps {
  onUploadComplete?: (material: MaterialSummary) => void;
}

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
}

export function UploadPanel({ onUploadComplete }: UploadPanelProps) {
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [lastChunkCount, setLastChunkCount] = useState<number | null>(null);
  const [processingMaterialId, setProcessingMaterialId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const isMountedRef = useRef(true);
  const isOnlineRef = useRef(isOnline);
  const pollTimeoutRef = useRef<number | null>(null);

  const fetchMaterials = useCallback(async (): Promise<MaterialSummary[]> => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<MaterialSummary[]>('/api/materials/');
      if (isMountedRef.current) {
        setMaterials(response.data);
      }
      return response.data;
    } catch (error) {
      if (isOnlineRef.current) {
        toast.error('Failed to load materials. Please try again later.');
      }
      return [];
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMaterials().catch(() => {
      /* handled in fetch */
    });
  }, [fetchMaterials]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      isOnlineRef.current = true;
      setIsOnline(true);
      if (uploadPhase === 'error') {
        setUploadPhase('idle');
      }
      setUploadMessage((prev) => (prev && prev.toLowerCase().includes('offline') ? null : prev));
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      setIsOnline(false);
      setIsSubmitting(false);
      setUploadPhase('error');
      setUploadMessage('You are offline. Reconnect to upload new study materials.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [uploadPhase]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setLastChunkCount(null);
    if (file) {
      setUploadPhase('idle');
      setUploadMessage(null);
    }
  }, []);

  const clearProcessingTimer = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const scheduleProcessingCheck = useCallback(
    (materialId: string, attempt = 0) => {
      if (!materialId) {
        return;
      }

      clearProcessingTimer();

      pollTimeoutRef.current = window.setTimeout(async () => {
        const materialsSnapshot = await fetchMaterials();
        if (!isMountedRef.current) {
          return;
        }

        const updatedMaterial = materialsSnapshot.find((material) => material.id === materialId);
        if (updatedMaterial && updatedMaterial.status === 'completed') {
          clearProcessingTimer();
          setUploadPhase('success');
          setUploadMessage(`Document processed successfully. ${updatedMaterial.chunk_count} chunks ready.`);
          setLastChunkCount(updatedMaterial.chunk_count);
          setProcessingMaterialId(null);
          toast.success(`${updatedMaterial.filename} processed • ${updatedMaterial.chunk_count} chunks ready!`);
          return;
        }

        if (attempt + 1 < 6) {
          scheduleProcessingCheck(materialId, attempt + 1);
        } else if (isMountedRef.current) {
          setUploadMessage('Processing… This may take another moment. Refresh to check for completion.');
        }
      }, Math.min(7000, 2500 + attempt * 1000));
    },
    [clearProcessingTimer, fetchMaterials]
  );

  const describeUploadError = useCallback((error: unknown): string => {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const detail = (error.response?.data as { detail?: string } | undefined)?.detail ?? '';
      const loweredDetail = detail.toLowerCase();

      if (status === 413) {
        if (loweredDetail.includes('quota')) {
          return 'Storage quota exceeded. Remove older files or contact support for more space.';
        }
        return 'File exceeds the 50 MB upload limit.';
      }

      if (status === 400) {
        if (loweredDetail.includes('file type')) {
          return 'Unsupported file type. Please upload a PDF document.';
        }
        if (loweredDetail.includes('extension')) {
          return 'File extension does not match the detected file type.';
        }
        if (loweredDetail.includes('empty')) {
          return 'The uploaded file appears to be empty.';
        }
        if (detail) {
          return detail;
        }
      }

      if (status === 500) {
        return 'The server had trouble processing your document. Please try again in a moment.';
      }
    }

    if (!isOnlineRef.current) {
      return 'You are offline. Reconnect to continue uploading.';
    }

    return 'Upload failed. Please try again in a moment.';
  }, []);

  useEffect(() => {
    if (!processingMaterialId) {
      return;
    }

    const trackedMaterial = materials.find((material) => material.id === processingMaterialId);
    if (trackedMaterial && trackedMaterial.status === 'completed') {
      clearProcessingTimer();
      setUploadPhase('success');
      setUploadMessage(`Document processed successfully. ${trackedMaterial.chunk_count} chunks ready.`);
      setLastChunkCount(trackedMaterial.chunk_count);
      setProcessingMaterialId(null);
    }
  }, [clearProcessingTimer, materials, processingMaterialId]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedFile) {
        toast.error('Please choose a PDF to upload.');
        return;
      }

      if (!isOnlineRef.current) {
        const offlineMessage = 'You are offline. Reconnect to upload new study materials.';
        setUploadPhase('error');
        setUploadMessage(offlineMessage);
        toast.error(offlineMessage);
        return;
      }

      const isLikelyPdf = ALLOWED_MIME_TYPES.has(selectedFile.type) || selectedFile.name.toLowerCase().endsWith('.pdf');
      if (!isLikelyPdf) {
        const typeMessage = 'Unsupported file type. Please upload a PDF document.';
        setUploadPhase('error');
        setUploadMessage(typeMessage);
        toast.error(typeMessage);
        return;
      }

      if (selectedFile.size === 0) {
        const emptyMessage = 'The selected file appears to be empty. Please choose another PDF.';
        setUploadPhase('error');
        setUploadMessage(emptyMessage);
        toast.error(emptyMessage);
        return;
      }

      if (selectedFile.size > MAX_UPLOAD_SIZE_BYTES) {
        const sizeMessage = 'File exceeds the 50 MB upload limit.';
        setUploadPhase('error');
        setUploadMessage(sizeMessage);
        toast.error(sizeMessage);
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);

      setIsSubmitting(true);
      setUploadPhase('uploading');
      setUploadMessage(`Uploading “${selectedFile.name}”…`);
      setLastChunkCount(null);
      clearProcessingTimer();
      try {
        const response = await apiClient.post<MaterialSummary>('/api/materials/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const material = response.data;
        setSelectedFile(null);
        setMaterials((prev) => [material, ...prev.filter((item) => item.id !== material.id)]);
        onUploadComplete?.(material);

        if (material.status === 'completed') {
          setUploadPhase('success');
          setUploadMessage(`Document processed successfully. ${material.chunk_count} chunks ready.`);
          setLastChunkCount(material.chunk_count);
          setProcessingMaterialId(null);
          toast.success(`${material.filename} uploaded • ${material.chunk_count} chunks ready!`);
        } else if (material.status === 'processing') {
          setUploadPhase('processing');
          setUploadMessage('Processing document… This may take a moment.');
          setProcessingMaterialId(material.id);
          scheduleProcessingCheck(material.id);
        } else {
          setUploadPhase('error');
          setUploadMessage('Upload completed, but processing failed. Check the list below for details.');
          setProcessingMaterialId(null);
          toast.error('Document processing failed. Please try again.');
        }
      } catch (error) {
        const message = describeUploadError(error);
        setUploadPhase('error');
        setUploadMessage(message);
        setProcessingMaterialId(null);
        toast.error(message);
      } finally {
        if (isMountedRef.current) {
          setIsSubmitting(false);
        }
      }
    },
    [clearProcessingTimer, describeUploadError, onUploadComplete, scheduleProcessingCheck, selectedFile]
  );

  const statusLabel = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'Ready';
      case 'processing':
        return 'Processing…';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }, []);

  const orderedMaterials = useMemo(() => {
    return [...materials].sort((a, b) => (b.uploaded_at ?? '').localeCompare(a.uploaded_at ?? ''));
  }, [materials]);

  return (
    <div className="soft-card pixel-border space-y-6 px-6 py-6">
      <div className="flex flex-col gap-2">
        <span className="badge-soft text-[0.6rem] font-semibold tracking-[0.16em] text-primary-foreground">Upload</span>
        <h2 className="text-brutalist text-lg text-foreground">Upload Study Materials</h2>
        <p className="text-sm text-muted-foreground">
          Add one focused PDF at a time. Smaller, intentional uploads help the AI coach personalize faster.
        </p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-foreground" htmlFor="pdf-upload">
          Choose a PDF to add to your library
        </label>
        <div className="rounded-3xl border-2 border-dashed border-primary/40 bg-white/70 px-4 py-6 text-center shadow-soft">
          <input
            id="pdf-upload"
            name="file"
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full cursor-pointer text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <p className="mt-3 text-xs text-muted-foreground">PDF only · Max size 50MB</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            size="lg"
            disabled={!selectedFile || isSubmitting || !isOnline}
            className="shadow-soft-button"
          >
            {isSubmitting
              ? 'Uploading…'
              : !isOnline
              ? 'Reconnect to upload'
              : selectedFile
              ? `Upload ${selectedFile.name}`
              : 'Upload PDF'}
          </Button>
          {selectedFile && (
            <span className="text-xs text-muted-foreground">
              Selected: <span className="font-semibold text-foreground">{selectedFile.name}</span>
            </span>
          )}
        </div>
      </form>

      {uploadMessage && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-soft"
          role="status"
          aria-live="polite"
        >
          {uploadPhase === 'uploading' || uploadPhase === 'processing' ? (
            <span className="size-5 animate-spin rounded-full border-2 border-muted border-t-primary" aria-hidden="true" />
          ) : uploadPhase === 'success' ? (
            <span className="kawaii-icon size-10 text-lg" aria-hidden="true">
              ✓
            </span>
          ) : (
            <span className="kawaii-icon size-10 text-lg" aria-hidden="true">
              !
            </span>
          )}
          <div className="flex flex-col gap-1 text-sm text-foreground">
            <span>{uploadMessage}</span>
            {uploadPhase === 'success' && lastChunkCount !== null && (
              <span className="text-xs text-muted-foreground">{lastChunkCount} chunks indexed</span>
            )}
          </div>
        </div>
      )}

      {!isOnline && !(uploadMessage && uploadMessage.toLowerCase().includes('offline')) && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <span className="kawaii-icon size-10 text-lg" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <p>You are offline. Uploads are disabled until you reconnect.</p>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-white/60 bg-white/75 px-4 py-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3 text-sm text-foreground">
          <span
            className={`inline-flex h-3 w-3 rounded-full ${
              uploadPhase === 'success'
                ? 'bg-success'
                : uploadPhase === 'error'
                ? 'bg-destructive'
                : uploadPhase === 'uploading' || uploadPhase === 'processing'
                ? 'bg-warning'
                : 'bg-muted-foreground/60'
            }`}
          />
          <span>
            {isLoading
              ? 'Loading your materials…'
              : `You have ${materials.length} upload${materials.length === 1 ? '' : 's'}`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => fetchMaterials().catch(() => undefined)}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <ul className="grid gap-3">
        {orderedMaterials.length === 0 && !isLoading ? (
          <li className="rounded-3xl border border-dashed border-primary/40 bg-primary/10 px-4 py-6 text-center text-sm text-primary">
            <p className="font-semibold text-foreground">No uploads yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Upload a PDF to start building your study library.</p>
          </li>
        ) : (
          orderedMaterials.map((material) => (
            <li
              className="flex flex-wrap items-center gap-3 rounded-3xl border border-white/60 bg-white/80 px-5 py-4 text-sm text-foreground shadow-soft transition-transform duration-300 ease-soft-bounce hover:-translate-y-[2px] hover:shadow-elevated"
              key={material.id}
            >
              <strong className="flex-1 text-left text-foreground">{material.filename}</strong>
              <span className="text-xs text-muted-foreground">{formatBytes(material.size)}</span>
              <span className="text-xs text-muted-foreground">Status: {statusLabel(material.status)}</span>
              <span className="text-xs text-muted-foreground">Chunks: {material.chunk_count}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default UploadPanel;
