// Basic UI smoke to avoid vitest/jest global collisions (ESM)
import { test, expect } from '@playwright/test';

test('home loads', async ({ page }) => {
  await page.goto('/');
  const title = await page.title();
  expect(title).toBeTruthy();
});
