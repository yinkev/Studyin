#!/usr/bin/env node
import open from 'open';

const url = process.env.DEV_URL || 'http://localhost:3000';

try {
  await open(url, { wait: false });
  console.log(`Opened ${url}`);
} catch (error) {
  console.error('Failed to open browser:', error?.message || error);
  process.exit(1);
}

