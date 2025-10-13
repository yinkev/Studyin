/**
 * MaterialsGrid - Display user's study materials
 * Accessibility: keyboard navigation, ARIA labels
 */

import { motion, Variants } from 'motion/react';
import { BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import { trackMaterialView } from '@/lib/analytics/tracker';

export interface Material {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  created_at: string;
  chunk_count: number;
}

export interface MaterialsGridProps {
  materials: Material[];
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const bentoCellVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function MaterialsGrid({ materials, className }: MaterialsGridProps) {
  return (
    <motion.div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {materials.map((material) => (
        <motion.div
          key={material.id}
          variants={bentoCellVariants}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="glass p-4 rounded-xl cursor-pointer hover:elevation-2 transition-shadow"
          onClick={() => trackMaterialView(material.id, material.filename)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              trackMaterialView(material.id, material.filename);
            }
          }}
          aria-label={`View material: ${material.filename}, ${material.chunk_count ?? 0} chunks`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {DOMPurify.sanitize(material.filename, { ALLOWED_TAGS: [] })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {material.chunk_count ?? 0} chunks • {formatFileSize(material.file_size)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
