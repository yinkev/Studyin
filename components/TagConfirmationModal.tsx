'use client';

import { useState, useEffect } from 'react';

interface TagConfirmationModalProps {
  isOpen: boolean;
  suggestedTags: string[];
  onConfirm: (finalTags: string[]) => void;
  onCancel: () => void;
}

export default function TagConfirmationModal({ isOpen, suggestedTags, onConfirm, onCancel }: TagConfirmationModalProps) {
  const [tags, setTags] = useState(suggestedTags);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setTags(suggestedTags);
  }, [suggestedTags]);

  if (!isOpen) {
    return null;
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-2xl shadow-lg m-4">
        <h2 className="text-2xl font-bold text-gray-800">Confirm Your Tags</h2>
        <p className="text-sm text-gray-500">The AI has suggested the following tags. Feel free to add, remove, or edit them before saving your new lesson.</p>
        
        <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              <span>{tag}</span>
              <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-blue-500 hover:text-blue-700">
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new tag..."
            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button 
            onClick={handleAddTag}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Add
          </button>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button 
            onClick={onCancel}
            className="px-6 py-2 font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(tags)}
            className="px-6 py-2 font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600"
          >
            Save Lesson
          </button>
        </div>
      </div>
    </div>
  );
}
