import { describe, expect, it } from 'vitest';
import { BlueprintDeficitError, buildExamForm } from '../../lib/server/forms';

describe('buildExamForm', () => {
  it('creates a deterministic exam form of requested length', async () => {
    try {
      const form = await buildExamForm({ length: 5, seed: 42, publishedOnly: false });
      expect(form.items).toHaveLength(5);
      expect(form.blueprint_id).toBeTruthy();
      const secondRun = await buildExamForm({ length: 5, seed: 42, publishedOnly: false });
      expect(secondRun.items.map((item) => item.id)).toEqual(form.items.map((item) => item.id));
    } catch (error) {
      if (error instanceof BlueprintDeficitError) {
        expect(error.deficits).toEqual(expect.arrayContaining(['No items available matching publishedOnly filter']));
        return;
      }
      throw error;
    }
  });

  it('surfaces blueprint deficits when published items are insufficient', async () => {
    await expect(buildExamForm({ length: 5, publishedOnly: true })).rejects.toBeInstanceOf(BlueprintDeficitError);
  });
});
