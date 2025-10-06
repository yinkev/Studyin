'use client';

import { Confidence } from '../core/types/mvp';

interface ConfidenceRatingProps {
  onSelect: (confidence: Confidence) => void;
}

const confidenceLevels: { level: Confidence; color: string; emoji: string }[] = [
  { level: 'Low', color: 'bg-red-500 hover:bg-red-600', emoji: '🤔' },
  { level: 'Medium', color: 'bg-yellow-500 hover:bg-yellow-600', emoji: '🙂' },
  { level: 'High', color: 'bg-green-500 hover:bg-green-600', emoji: '😎' },
];

export default function ConfidenceRating({ onSelect }: ConfidenceRatingProps) {
  return (
    <div className="my-4 p-4 border rounded-lg bg-gray-50">
      <p className="text-center font-semibold text-gray-700 mb-3">How confident were you?</p>
      <div className="flex justify-center gap-4">
        {confidenceLevels.map(({ level, color, emoji }) => (
          <button 
            key={level} 
            onClick={() => onSelect(level)}
            className={`flex flex-col items-center justify-center w-24 h-24 p-2 rounded-xl text-white font-bold shadow-md transition-transform transform hover:scale-110 ${color}`}>
            <span className="text-3xl mb-1">{emoji}</span>
            <span>{level}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
