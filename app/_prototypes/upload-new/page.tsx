/**
 * Upload Page - Nova Design System
 * Simplified upload flow with new UI
 */

'use client';

import { DashboardLayout } from '@/components/newui/templates/DashboardLayout';
import { UploadDropzone } from '@/components/newui/molecules/UploadDropzone';
import { Button } from '@/components/newui/atoms/Button';
import { Text } from '@/components/newui/atoms/Text';
import { AuraIcon } from '@/components/newui/icons';
import { Badge } from '@/components/newui/atoms/Badge';
import { ProgressBar } from '@/components/newui/molecules/ProgressBar';
import { useUploader } from '@/lib/hooks/useUploader';

export default function UploadPage() {
  const { file, setFile, jobs, error, isProcessing, enqueueUpload } = useUploader();

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleUpload = async () => {
    await enqueueUpload();
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5B9CFF] to-[#9B6BFF] flex items-center justify-center">
              <AuraIcon icon="Upload" size="xl" color="white" />
            </div>
          </div>
          <Text as="h1" size="4xl" weight="bold" font="display">
            Upload & Process
          </Text>
          <Text size="lg" variant="med">
            Upload documents to create adaptive study lessons
          </Text>
        </div>

        {/* Upload Zone */}
        <UploadDropzone
          onFilesSelected={handleFilesSelected}
          accept=".pdf,.ppt,.pptx,.docx,.md"
          multiple={false}
        />

        {/* Selected File */}
        {file && (
          <div className="flex items-center justify-between p-4 bg-[#0F172A] border border-[#162036] rounded-lg">
            <div className="flex items-center gap-3">
              <AuraIcon icon="BookOpen" size="md" color="#5B9CFF" />
              <div>
                <Text size="base" weight="medium">
                  {file.name}
                </Text>
                <Text size="sm" variant="low">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              Process File
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-[#FF6B6B]/10 border border-[#FF6B6B] rounded-lg">
            <Text size="sm" variant="high">
              {error}
            </Text>
          </div>
        )}

        {/* Job Queue */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            <Text as="h2" size="xl" weight="semibold">
              Processing Queue
            </Text>
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 bg-[#0F172A] border border-[#162036] rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Text size="base" weight="medium">
                      {job.fileName || 'Processing...'}
                    </Text>
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'success'
                          : job.status === 'failed'
                          ? 'danger'
                          : 'info'
                      }
                    >
                      {job.status}
                    </Badge>
                  </div>
                  {job.status === 'processing' && (
                    <ProgressBar value={job.progress || 0} showLabel />
                  )}
                  {job.currentStep && (
                    <Text size="sm" variant="med">
                      {job.currentStep}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
