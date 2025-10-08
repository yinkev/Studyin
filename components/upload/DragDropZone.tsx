'use client';

/**
 * Drag & Drop Upload Zone — MAX GRAPHICS MODE
 * Beautiful file drop zone with drag animations
 * Supports PDF, PPT, DOCX, Markdown
 */

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { animate, useReducedMotion } from 'motion/react';

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/markdown': ['.md'],
};

export function DragDropZone({ onFileSelect, selectedFile, disabled = false }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(true);

    // Animate scale up
    if (dropZoneRef.current) {
      animate(dropZoneRef.current, { scale: 1.02 }, { duration: 0.2, easing: 'ease-out' });
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    // Animate scale down
    if (dropZoneRef.current) {
      animate(dropZoneRef.current, { scale: 1 }, { duration: 0.2, easing: 'ease-out' });
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    // Reset scale with elastic bounce
    if (dropZoneRef.current) {
      animate(dropZoneRef.current, { scale: 1 }, { duration: 0.3, easing: 'ease-out' });
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      ref={dropZoneRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        glass-clinical-card relative h-64 transition-all cursor-pointer
        ${
          isDragging
            ? 'border-brand-light !bg-brand-light/20 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
          : selectedFile
            ? 'border-semantic-success !bg-semantic-success/10'
            : 'hover:border-brand-light'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileInputChange}
        accept={Object.keys(ACCEPTED_TYPES).join(',')}
        disabled={disabled}
      />

      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        {/* Upload Icon */}
        <div className="mb-4">
          {selectedFile ? (
            <div className="text-6xl">📄</div>
          ) : (
            <svg
              className={`h-20 w-20 transition-colors ${
                isDragging ? 'text-brand-light' : 'text-brand-secondary'
              }`}
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l7.5-7.5L18 15m-7.5-7.5V21" />
            </svg>
          )}
        </div>

        {/* Text */}
        {selectedFile ? (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-semantic-success">{selectedFile.name}</p>
            <p className="text-sm text-text-high">{formatFileSize(selectedFile.size)}</p>
            <p className="text-xs text-text-med">Click to change file</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-2xl font-bold text-text-high">
              {isDragging ? 'Drop it like it\'s hot! 🔥' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-sm text-text-med">PDF • PPT • DOCX • Markdown</p>
            <p className="text-xs text-text-low">Maximum file size: 50MB</p>
          </div>
        )}

        {/* Animated Pulse Ring */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full border-4 border-brand-light animate-ping opacity-30" />
          </div>
        )}
      </div>
    </div>
  );
}
