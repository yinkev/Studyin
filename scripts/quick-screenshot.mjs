#!/usr/bin/env node
import { chromium } from 'playwright';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(dirname(__dirname), 'docs', 'screenshots');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

console.log('📸 Capturing fresh screenshots...\n');

// Upload page
await page.goto('http://localhost:3005/upload', { waitUntil: 'networkidle', timeout: 10000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: join(screenshotsDir, 'upload-page.png'), fullPage: true });
console.log('✅ Upload page captured');

// Landing page
try {
  await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(screenshotsDir, 'landing-page.png'), fullPage: true });
  console.log('✅ Landing page captured');
} catch (e) {
  console.log('⚠️  Landing page error:', e.message);
}

// Mobile upload
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:3005/upload', { waitUntil: 'domcontentloaded', timeout: 10000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: join(screenshotsDir, 'mobile-upload.png'), fullPage: true });
console.log('✅ Mobile upload captured');

await browser.close();
console.log('\n✨ Done!');
