// Basic UI smoke to avoid vitest/jest global collisions
if (!process.env.VITEST) {
  const { test, expect } = require('@playwright/test');

  test('home loads', async ({ page }) => {
    await page.goto('/');
    // Title should at least exist
    const title = await page.title();
    expect(title).toBeTruthy();
  });
}
