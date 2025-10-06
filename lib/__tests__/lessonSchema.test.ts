import { describe, it, expect } from 'vitest';
import { interactiveLessonSchema } from '../types/lesson';

const baseLesson = {
  schema_version: '1.0.0',
  id: 'lesson.demo',
  lo_id: 'lo.demo',
  title: 'Demo Lesson',
  summary: 'A short demo lesson.',
  tags: ['demo'],
  high_yield: ['Key fact'],
  pitfalls: ['Common pitfall'],
  animation_timeline: [
    { beat: 0, duration_s: 5, narration: 'Intro', visual: 'Intro visual' }
  ],
  content: [
    { type: 'heading', level: 1, text: 'Heading' },
    {
      type: 'multiple_choice_question',
      id: 'q1',
      learningObjective: 'lo.demo',
      stem: 'What is demo?',
      choices: [
        { id: 'A', text: 'Answer A' },
        { id: 'B', text: 'Answer B' }
      ],
      correctChoice: 'A'
    }
  ]
};

describe('interactiveLessonSchema', () => {
  it('accepts a well-formed lesson', () => {
    const result = interactiveLessonSchema.parse(baseLesson);
    expect(result.id).toBe('lesson.demo');
    expect(result.content.length).toBe(2);
  });

  it('rejects lessons without an MCQ when content is provided', () => {
    expect(() =>
      interactiveLessonSchema.parse({
        ...baseLesson,
        id: 'lesson.no-mcq',
        content: [{ type: 'heading', level: 1, text: 'Hello' }]
      })
    ).toThrow(/must include at least one multiple choice question/i);
  });
});
