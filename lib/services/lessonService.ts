import { promises as fs } from 'fs';
import path from 'path';
import { EventBus, globalEventBus } from '../eventBus';
import {
  saveLessonRequestedEventSchema,
  lessonCreatedEventSchema,
  type SaveLessonRequestedEvent
} from '../../core/types/events';
import { interactiveLessonSchema, type InteractiveLesson } from '../types/lesson';

export interface LessonStorageAdapter {
  save(lesson: InteractiveLesson): Promise<void>;
  list(): Promise<InteractiveLesson[]>;
  load(id: string): Promise<InteractiveLesson | null>;
}

const DEFAULT_DIR = process.env.LESSON_STORAGE_DIR ?? path.join(process.cwd(), 'data', 'lessons');

class FileSystemLessonStorage implements LessonStorageAdapter {
  private readonly dir: string;

  constructor(dir = DEFAULT_DIR) {
    this.dir = dir;
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private resolvePath(lessonId: string): string {
    const safeId = lessonId.replace(/[^a-zA-Z0-9-_]/g, '-');
    return path.join(this.dir, `${safeId}.lesson.json`);
  }

  async save(lesson: InteractiveLesson): Promise<void> {
    const payload = interactiveLessonSchema.parse(lesson);
    await this.ensureDir();
    const filePath = this.resolvePath(payload.id);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  }

  async list(): Promise<InteractiveLesson[]> {
    await this.ensureDir();
    const entries = await fs.readdir(this.dir).catch(() => [] as string[]);
    const lessons: InteractiveLesson[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.lesson.json')) continue;
      const filePath = path.join(this.dir, entry);
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        const json = JSON.parse(raw);
        const lesson = interactiveLessonSchema.parse(json);
        lessons.push(lesson);
      } catch (error) {
        console.warn(`LessonService: failed to parse ${filePath}`, error);
      }
    }
    lessons.sort((a, b) => a.id.localeCompare(b.id));
    return lessons;
  }

  async load(id: string): Promise<InteractiveLesson | null> {
    await this.ensureDir();
    const filePath = this.resolvePath(id);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const json = JSON.parse(raw);
      return interactiveLessonSchema.parse(json);
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}

export interface LessonServiceOptions {
  bus?: EventBus;
  storage?: LessonStorageAdapter;
}

export class LessonService {
  private readonly bus: EventBus;
  private readonly storage: LessonStorageAdapter;
  private readonly unsubs: Array<() => void> = [];

  constructor(options?: LessonServiceOptions) {
    this.bus = options?.bus ?? globalEventBus;
    this.storage = options?.storage ?? new FileSystemLessonStorage();
    this.unsubs.push(
      this.bus.on('SAVE_LESSON_REQUESTED', (event: SaveLessonRequestedEvent) => this.handleSaveLesson(event))
    );
  }

  async handleSaveLesson(event: SaveLessonRequestedEvent): Promise<void> {
    const parsed = saveLessonRequestedEventSchema.parse(event);
    const lesson = interactiveLessonSchema.parse(parsed.lesson);
    await this.storage.save(lesson);
    const created = lessonCreatedEventSchema.parse({
      type: 'LESSON_CREATED',
      lesson,
      jobId: parsed.requestId ?? parsed.id,
      ts: Date.now()
    });
    await this.bus.emit(created);
  }

  async listLessons(): Promise<InteractiveLesson[]> {
    return this.storage.list();
  }

  async loadLesson(id: string): Promise<InteractiveLesson | null> {
    return this.storage.load(id);
  }

  dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs.length = 0;
  }
}

export function createLessonService(options?: LessonServiceOptions): LessonService {
  return new LessonService(options);
}

export const defaultLessonStorage = new FileSystemLessonStorage();
