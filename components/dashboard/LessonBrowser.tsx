'use client';

/**
 * Lesson Browser - Clinical Clarity Design
 * Browse and select available lessons
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge, Button } from '@mantine/core';

interface Lesson {
  id: string;
  title: string;
  fileName: string;
  itemCount: number;
  difficulty?: string;
}

export function LessonBrowser() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/lessons')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setLessons(data.lessons || []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLessons([]);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-high)' }}>
          Available Lessons
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-med)' }}>Loading lessons...</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-high)' }}>
          Available Lessons
        </h2>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-high)' }}>
            No lessons yet
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-med)' }}>
            Upload a document to generate your first interactive lesson
          </p>
          <Link href="/upload">
            <Button className="clinical-button">
              Upload Document
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-high)' }}>
        Available Lessons ({lessons.length})
      </h2>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <Link key={lesson.id} href={`/study?lesson=${lesson.id}`}>
            <div
              className="p-4 rounded-lg border transition-clinical cursor-pointer hover:shadow-clinical-md"
              style={{
                borderColor: 'var(--border-default)',
                background: 'var(--surface-bg0)'
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate" style={{ color: 'var(--text-high)' }}>
                    {lesson.title}
                  </h3>
                  <p className="text-xs mb-2 truncate" style={{ color: 'var(--text-low)' }}>
                    {lesson.fileName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge size="sm" className="clinical-badge badge-info">
                      {lesson.itemCount} questions
                    </Badge>
                    {lesson.difficulty && (
                      <Badge
                        size="sm"
                        className={`clinical-badge ${
                          lesson.difficulty === 'easy' ? 'badge-success' :
                          lesson.difficulty === 'medium' ? 'badge-warning' :
                          'badge-danger'
                        }`}
                      >
                        {lesson.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--brand-primary)' }}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
