// Global setup for Playwright (ESM) to prepare minimal app state
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

export default async function globalSetup() {
  // Ensure data/lessons exists to avoid ENOENT console warnings on /study
  const lessonsDir = join(projectRoot, 'data', 'lessons');
  try {
    await mkdir(lessonsDir, { recursive: true });
  } catch {}
}

