import { describe, expect, it } from 'vitest';
import { ItemBankNotFoundError, loadStudyItems } from '../lib/getItems';

describe('loadStudyItems', () => {
  it('returns items with metadata', async () => {
    const { items, total, bankId } = await loadStudyItems();
    expect(bankId).toBe('upper-limb-oms1');
    expect(total).toBeGreaterThan(0);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]).toHaveProperty('status');
  });

  it('filters by LO identifiers', async () => {
    const targetLo = 'lo.radial-nerve';
    const { items, total } = await loadStudyItems({ los: [targetLo] });
    expect(total).toBe(items.length);
    expect(items.every((item) => item.los.includes(targetLo))).toBe(true);
  });

  it('filters by difficulty and applies limits', async () => {
    const { items } = await loadStudyItems({ difficulties: ['easy'], limit: 2 });
    expect(items.length).toBeLessThanOrEqual(2);
    expect(items.every((item) => item.difficulty === 'easy')).toBe(true);
  });

  it('throws when the bank directory is missing', async () => {
    await expect(loadStudyItems({ bankId: 'does-not-exist' })).rejects.toBeInstanceOf(
      ItemBankNotFoundError
    );
  });
});
