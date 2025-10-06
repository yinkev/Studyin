'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { interactiveLessonSchema, type InteractiveLesson } from '../types/lesson';

export interface UploadJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  lesson?: InteractiveLesson;
  error?: string;
  localPath?: string;
}

interface QueueJobResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  result?: { lessonId?: string };
}

export function useUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  const enqueueUpload = useCallback(async () => {
    if (!file) {
      setError('Choose a file to upload.');
      return null;
    }
    setError(null);

    // 1) Upload binary so local worker/CLI can read a stable path
    let uploadedPath: string | undefined;
    let sanitizedName = file.name;
    try {
      const form = new FormData();
      form.append('file', file);
      const upRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upRes.ok) throw new Error(`Upload failed (${upRes.status})`);
      const upJson = (await upRes.json()) as { fileName: string; sourcePath: string };
      sanitizedName = upJson.fileName;
      uploadedPath = upJson.sourcePath;
    } catch (err: any) {
      setError(err?.message ?? 'Upload failed');
      return null;
    }

    // 2) Enqueue job for background processing
    let jobId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `job_${Date.now()}`;
    try {
      const response = await fetch('/api/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: sanitizedName, fileSize: file.size, clientJobId: jobId, sourcePath: uploadedPath })
      });
      if (!response.ok) {
        throw new Error(`Failed to enqueue job (${response.status})`);
      }
      const json = (await response.json()) as { jobId?: string };
      if (json.jobId) jobId = json.jobId;
    } catch (enqueueErr: any) {
      setError(enqueueErr?.message ?? 'Failed to enqueue job.');
      return null;
    }

    setJobs((current) => [
      ...current,
      {
        id: jobId,
        fileName: sanitizedName,
        fileSize: file.size,
        status: 'queued',
        localPath: uploadedPath
      }
    ]);

    return jobId;
  }, [file]);

  const pendingJobIds = useMemo(
    () => jobs.filter((job) => job.status === 'queued' || job.status === 'processing').map((job) => job.id),
    [jobs]
  );

  useEffect(() => {
    if (!pendingJobIds.length) {
      return;
    }

    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await Promise.all(
        pendingJobIds.map(async (jobId) => {
          try {
            const response = await fetch(`/api/queue/status/${jobId}`, { cache: 'no-store' });
            if (!response.ok) {
              if (response.status === 404) {
                setJobs((current) =>
                  current.map((job) =>
                    job.id === jobId ? { ...job, status: 'failed', error: 'Job not found on server' } : job
                  )
                );
              }
              return;
            }
            const json = (await response.json()) as QueueJobResponse;
            const normalizedStatus: UploadJob['status'] = json.status === 'completed' ? 'ready' : json.status;
            setJobs((current) =>
              current.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      status: normalizedStatus,
                      error: json.error ?? job.error
                    }
                  : job
              )
            );

            if (json.status === 'completed' && json.result?.lessonId) {
              const lessonResponse = await fetch(`/api/lessons/${json.result.lessonId}`, { cache: 'no-store' });
              if (lessonResponse.ok) {
                const lesson = interactiveLessonSchema.parse(await lessonResponse.json());
                setJobs((current) =>
                  current.map((job) =>
                    job.id === jobId
                      ? {
                          ...job,
                          lesson,
                          status: 'ready'
                        }
                      : job
                  )
                );
              }
            }
          } catch (pollError: any) {
            setJobs((current) =>
              current.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      error: pollError?.message ?? 'Polling failed'
                    }
                  : job
              )
            );
          }
        })
      );

      if (!cancelled) {
        setTimeout(tick, 1500);
      }
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [pendingJobIds]);

  const reset = useCallback(() => {
    setFile(null);
    setError(null);
    setJobs([]);
  }, []);

  const activeJob = useMemo(
    () => jobs.find((job) => job.status === 'queued' || job.status === 'processing') ?? null,
    [jobs]
  );
  const isProcessing = pendingJobIds.length > 0;

  return {
    file,
    setFile,
    jobs,
    activeJob,
    error,
    isProcessing,
    enqueueUpload,
    reset
  } as const;
}

export default useUploader;
