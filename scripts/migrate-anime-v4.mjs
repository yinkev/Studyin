#!/usr/bin/env node

/**
 * Migration script to update anime.js v3 syntax to v4
 *
 * Changes:
 * - Import: anime -> { animate as anime }
 * - Property syntax: [from, to] -> { from, to }
 * - Callbacks: complete -> onComplete
 * - Easing: easing -> ease
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filesToMigrate = [
  'app/(dev)/time-machine/TimeMachineClient.tsx',
  'components/analytics/BlueprintDriftEnhanced.tsx',
  'components/analytics/SessionTimeline.tsx',
  'components/upload/JobQueuePanel.tsx',
  'components/upload/DragDropZone.tsx',
  'components/upload/CLIProgressDisplay.tsx',
  'components/organisms/LessonMetaPanel.tsx',
  'components/effects/MasteryBurst.tsx',
  'components/effects/ConfettiBurst.tsx',
  'components/InteractiveLessonViewer.tsx',
  'components/study/EvidencePanel.tsx',
  'components/study/KeyboardShortcutsOverlay.tsx',
  'components/study/AbilityTrackerGraph.tsx',
  'components/study/WhyThisNextPill.tsx',
  'components/atoms/GlowCard.tsx',
  'components/molecules/TimelineBeatCard.tsx',
  'components/landing/HeroSection.tsx',
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // 1. Update import statement
  if (content.includes("import anime from 'animejs'")) {
    content = content.replace(
      "import anime from 'animejs'",
      "import { animate as anime } from 'animejs'"
    );
    modified = true;
  }

  // 2. Update easing -> ease
  if (content.includes('easing:')) {
    content = content.replace(/easing:/g, 'ease:');
    modified = true;
  }

  // 3. Update complete -> onComplete
  if (content.includes('complete:')) {
    content = content.replace(/complete:/g, 'onComplete:');
    modified = true;
  }

  // 4. Update begin -> onBegin
  if (content.includes('begin:')) {
    content = content.replace(/begin:/g, 'onBegin:');
    modified = true;
  }

  // 5. Update update -> onUpdate
  if (content.includes('update:')) {
    content = content.replace(/update:/g, 'onUpdate:');
    modified = true;
  }

  // 6. Note: Array syntax [from, to] needs manual review
  // We can't automatically convert without context

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

console.log('🚀 Starting anime.js v4 migration...\n');

filesToMigrate.forEach(migrateFile);

console.log('\n✨ Migration complete!');
console.log('\n⚠️  IMPORTANT: Array syntax [from, to] needs manual review.');
console.log('Search for anime( calls and update property values to { from, to } format.');
