'use client';

import { InteractiveLesson } from '../core/types/mvp';

interface LibraryViewProps {
  lessons: InteractiveLesson[];
  onSelectLesson: (lessonId: string) => void;
  // In the future, we would also pass lesson statuses (completed, active, locked)
}

const pathStyles = [
  { top: '0rem', left: '50%', transform: 'translateX(-50%)' },
  { top: '6rem', left: 'calc(50% + 4rem)' },
  { top: '12rem', left: 'calc(50% - 4rem)' },
  { top: '18rem', left: '50%', transform: 'translateX(-50%)' },
  { top: '24rem', left: 'calc(50% + 4rem)' },
  { top: '30rem', left: 'calc(50% - 4rem)' },
];

// A Duolingo-style visual path for lessons.
export default function LibraryView({ lessons, onSelectLesson }: LibraryViewProps) {
  if (lessons.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg text-gray-500 bg-white/50">
        <h3 className="text-xl font-semibold">Your Library is Empty</h3>
        <p className="mt-2">Upload a file to create your first lesson!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xs mx-auto py-8" style={{ minHeight: '40rem' }}>
      {/* Dashed line path - purely decorative */}
      <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: -1 }}>
        <path 
          d="M 50,20 C 100,100 0,180 50,260 S 100,340 50,420" 
          stroke="#CBD5E0" 
          strokeWidth="4" 
          strokeDasharray="8 8"
          fill="none"
          transform="scale(1.8 1.2) translate(-20, 0)"
        />
      </svg>

      {lessons.map((lesson, index) => {
        const style = pathStyles[index % pathStyles.length];
        // Add a vertical offset for lessons beyond the initial path styles
        const verticalOffset = Math.floor(index / pathStyles.length) * 36; // 36rem per cycle

        return (
          <div 
            key={lesson.id} 
            className="absolute"
            style={{ ...style, top: `calc(${style.top} + ${verticalOffset}rem)` }}
          >
            <button 
              onClick={() => onSelectLesson(lesson.id)}
              className="w-24 h-24 rounded-full bg-blue-500 border-4 border-white shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 ease-in-out"
            >
              <span className="text-3xl">📚</span>
            </button>
            <div className="text-center mt-2 w-32 -ml-4">
              <p className="font-bold text-gray-700 text-sm truncate">
                {lesson.content.find(c => c.type === 'heading')?.text || 'Untitled Lesson'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
