import { attemptEventSchema } from 'lib/core/schemas';
import { appendAttempt } from '../../lib/server/events';
import { TelemetryService } from '../../core/types/repositories';
import type { z } from 'zod';

export class LocalTelemetryService implements TelemetryService {
  async recordAttempt(event: z.infer<typeof attemptEventSchema>): Promise<void> {
    const parsed = attemptEventSchema.parse(event);
    await appendAttempt(parsed);
  }
}
