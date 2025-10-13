import UploadPanel from '@/components/upload/UploadPanel';
import type { View } from '@/components/NavBar';

interface UploadViewProps {
  onNavigate: (view: View) => void;
}

export function UploadView({ onNavigate }: UploadViewProps) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Study Materials</h1>
        <p className="text-slate-600">
          Upload PDFs, notes, or documents to build your personalized knowledge base
        </p>
      </div>

      <UploadPanel />
    </div>
  );
}
