import { createLessonService, LessonService } from './lessonService';
import { createStateService, StateService } from './stateService';

let lessonServiceSingleton: LessonService | null = null;
let stateServiceSingleton: StateService | null = null;

export function ensureLessonService(): LessonService {
  if (!lessonServiceSingleton) {
    lessonServiceSingleton = createLessonService();
  }
  return lessonServiceSingleton;
}

export function ensureStateService(): StateService {
  if (!stateServiceSingleton) {
    stateServiceSingleton = createStateService();
  }
  return stateServiceSingleton;
}

export function ensureCoreServices(): void {
  ensureLessonService();
  ensureStateService();
}
