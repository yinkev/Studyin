# Skill Tree System - Medical Education Gamification

## Overview

A world-class skill tree system for medical education, inspired by best practices from Duolingo, Khan Academy, and Codecademy. This system provides progressive unlocking, mastery tracking, and visual progression for medical learners.

---

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Data Model](#data-model)
3. [Progression Mechanics](#progression-mechanics)
4. [Integration Points](#integration-points)
5. [Visual Design](#visual-design)
6. [Implementation Guide](#implementation-guide)
7. [API Reference](#api-reference)

---

## Core Concepts

### Skill Nodes

**Skill Nodes** are the fundamental units of the skill tree. Each node represents a learning objective (LO) from the existing study engine, enhanced with gamification metadata.

**Node States:**
- **Locked** 🔒 - Prerequisites not met
- **Available** ✅ - Ready to start
- **Attempted** 📝 - Started but <70% accuracy
- **Familiar** 📘 - 70-89% accuracy (50 mastery points)
- **Proficient** 📗 - 90-99% accuracy (80 mastery points)
- **Mastered** 🏆 - 100% mastery confirmed via IRT model (100 points)

**Node Types:**
- **Foundation** - Core concepts, lower difficulty (1x XP multiplier)
- **Core** - Standard medical knowledge (1.5x XP multiplier)
- **Advanced** - Complex clinical reasoning (2x XP multiplier)
- **Expert** - High-yield, board-style questions (2.5x XP multiplier)
- **Capstone** - Integrative, multi-LO challenges (3x XP multiplier)

### Mastery System

Inspired by **Khan Academy's mastery levels**, progression follows a proven educational model:

1. **0-49 points** - Attempted (struggling)
2. **50-79 points** - Familiar (developing understanding)
3. **80-99 points** - Proficient (high performance)
4. **100 points** - Mastered (confirmed via IRT with 95% confidence)

### Unlock Mechanics

Nodes unlock based on:
- **Prerequisites**: All prerequisite nodes must be mastered
- **XP Requirement**: Learner must have earned sufficient total XP
- **Level Requirement**: Minimum level based on node type (Foundation=1, Core=3, Advanced=8, Expert=15, Capstone=25)
- **Domain Experience** (for advanced nodes): Minimum nodes mastered in that domain

---

## Data Model

### SkillNode Interface

```typescript
interface SkillNode {
  // Identity
  id: string;                    // e.g., "cardio-heart-failure"
  loId: string;                  // Maps to Learning Objective

  // Display
  title: string;                 // "Acute Heart Failure"
  description: string;           // What the learner will master
  icon?: string;                 // Emoji or icon identifier

  // Classification
  type: SkillNodeType;           // foundation | core | advanced | expert | capstone
  domain: string;                // "Cardiology"
  tags: string[];                // ["high-yield", "board-exam"]

  // Prerequisites
  prerequisiteIds: string[];     // Must be mastered first
  unlocks: string[];             // Nodes unlocked by this

  // Requirements
  xpRequired: number;            // XP to unlock
  minQuestionsToAttempt: number; // Min questions for "Attempted" status
  minQuestionsForMastery: number;// Min questions for mastery
  masteryThreshold: number;      // IRT theta threshold (default: 1.5)

  // Current State
  status: SkillNodeStatus;       // Current mastery level
  progress: SkillNodeProgress;   // Detailed progress

  // Metadata
  estimatedMinutes: number;      // Time to master
  difficultyRating: number;      // 1-10 scale
  highYield: boolean;            // Board-exam critical
  clinicalRelevance: string;     // Real-world context

  // Timestamps
  firstAttemptedAt?: string;
  masteredAt?: string;
  lastReviewedAt?: string;
}
```

### SkillNodeProgress Interface

```typescript
interface SkillNodeProgress {
  // Question metrics
  questionsAttempted: number;
  questionsCorrect: number;
  currentAccuracy: number;       // 0-100

  // IRT/Rasch model integration
  thetaHat: number;              // Ability estimate
  standardError: number;         // Confidence
  masteryProbability: number;    // P(theta > threshold)

  // Rewards
  xpEarned: number;              // Total XP from this node
  masteryPoints: number;         // 0-100 (Khan Academy style)

  // Engagement
  studySessions: number;
  totalStudyTimeMs: number;
  streakDays: number;

  // Retention (for mastered nodes)
  retentionStrength?: number;    // FSRS-based
  nextReviewDue?: string;        // ISO timestamp
  lapseCount?: number;           // Times dropped below mastery
}
```

### SkillTree Interface

```typescript
interface SkillTree {
  metadata: SkillTreeMetadata;
  nodes: Record<string, SkillNode>;    // Keyed by node ID
  edges: SkillTreeEdge[];              // Dependency relationships
  rootNodeIds: string[];               // Entry points

  learnerProgress: LearnerSkillTreeProgress; // Per-learner state
}
```

---

## Progression Mechanics

### Status Transitions

```typescript
// Automatic status determination based on progress
function determineSkillNodeStatus(
  node: SkillNode,
  prerequisites: SkillNode[],
  learnerLevel: number,
  learnerTotalXP: number
): SkillNodeStatus
```

**Transition Rules:**
1. **Locked → Available**: All prerequisites mastered + XP requirement met
2. **Available → Attempted**: First question answered
3. **Attempted → Familiar**: Accuracy ≥70% + min questions met
4. **Familiar → Proficient**: Accuracy ≥90% + mastery probability ≥80%
5. **Proficient → Mastered**: Mastery probability ≥95% + IRT threshold met

### XP Rewards

**Per Question:**
- Foundation: 5 XP
- Core: 10 XP
- Advanced: 15 XP
- Expert: 20 XP
- Capstone: 25 XP

**Milestone Bonuses:**
- First attempt: 25-150 XP (based on node type)
- Reach Familiar: 50-300 XP
- Reach Proficient: 100-600 XP
- Reach Mastered: 250-1500 XP
- Perfect accuracy (100% on 10+ questions): 100-600 XP bonus
- Speed bonus (<10s): 25-150 XP

**Example:** Mastering a Core node with 20 questions at 95% accuracy:
- Base XP: 20 questions × 10 XP = 200 XP
- First attempt bonus: 50 XP
- Familiar milestone: 100 XP
- Proficient milestone: 200 XP
- Mastered milestone: 500 XP
- **Total: ~1050 XP**

### Unlock Requirements

```typescript
interface UnlockRequirements {
  minLevel: number;                    // Global level requirement
  xpRequired: number;                  // Total XP needed
  prerequisitesAllMastered: boolean;   // Hard requirement
  prerequisitesMasteryPoints: number;  // Sum of prereq mastery points
  minTotalQuestionsAnswered: number;   // Platform-wide experience
  domainExperience?: {                 // Advanced nodes only
    domain: string;
    minNodesMastered: number;
  };
}
```

---

## Integration Points

### 1. IRT/Rasch Model Integration

**File:** `/lib/study-engine.ts`

The skill tree syncs with the existing IRT model:

```typescript
// Map LearnerLoState → SkillNodeProgress
function initializeProgressFromIRT(
  irtState: LearnerLoState,
  itemStats: { attempts: number; correct: number }
): SkillNodeProgress
```

**Flow:**
1. Study session updates `LearnerLoState` (theta, SE, mastery probability)
2. Skill tree system reads latest IRT state
3. Progress updated: accuracy, mastery points, status
4. XP awarded based on status transitions

### 2. XP System Integration

**File:** `/lib/xp-system.ts`

**Existing System:**
- Level progression (exponential curve: `baseXP * level^1.5`)
- Total XP tracking
- Streak multipliers

**Skill Tree Extension:**
- Nodes award XP on milestone completion
- Status transitions trigger XP bonuses
- High-yield nodes provide bonus multipliers

```typescript
// Award XP when node status improves
function awardNodeMilestoneXP(
  oldStatus: SkillNodeStatus,
  newStatus: SkillNodeStatus,
  nodeType: SkillNodeType
): number
```

### 3. Analytics Integration

**File:** `/lib/getAnalytics.ts`

**Data Flow:**
- `ttm_per_lo` (time to mastery) → Node `estimatedMinutes`
- `elg_per_min` (efficiency) → Recommended nodes
- Accuracy metrics → Progress tracking

```typescript
function enrichSkillTreeWithAnalytics(
  skillTree: SkillTree,
  analytics: AnalyticsSummary | null
): SkillTree
```

### 4. Learner State Integration

**File:** `/lib/server/study-state.ts`

**Sync Process:**
```typescript
function syncSkillTreeFromLearnerState(
  learnerState: LearnerState,
  treeDefinition: SkillTree
): SkillTree
```

**What Gets Synced:**
- `learnerState.los` → Node progress (theta, SE, mastery)
- `learnerState.items` → Question counts, accuracy
- `learnerState.gamification` → Level, XP for unlock checks
- `learnerState.retention` → Review scheduling for mastered nodes

---

## Visual Design

### Node Visual States

#### Locked 🔒
```css
background: rgba(156, 163, 175, 0.2);  /* gray-400 */
border: rgba(156, 163, 175, 0.4);
text: rgba(156, 163, 175, 1);
glow: none;
```

#### Available ✅
```css
background: rgba(59, 130, 246, 0.1);   /* blue-500 */
border: rgba(59, 130, 246, 0.4);
text: rgba(59, 130, 246, 1);
glow: 0 0 20px rgba(59, 130, 246, 0.3);
animation: pulse (for high-yield);
```

#### Attempted 📝
```css
background: rgba(245, 158, 11, 0.1);   /* amber-500 */
border: rgba(245, 158, 11, 0.4);
text: rgba(245, 158, 11, 1);
```

#### Familiar 📘
```css
background: rgba(59, 130, 246, 0.15);  /* blue-500 */
border: rgba(59, 130, 246, 0.6);
glow: 0 0 15px rgba(59, 130, 246, 0.2);
```

#### Proficient 📗
```css
background: rgba(139, 92, 246, 0.15);  /* violet-500 */
border: rgba(139, 92, 246, 0.6);
glow: 0 0 20px rgba(139, 92, 246, 0.3);
```

#### Mastered 🏆
```css
background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(245, 158, 11, 0.2));
border: rgba(16, 185, 129, 0.8);
icon: rgba(245, 158, 11, 1); /* Gold icon */
glow: 0 0 30px rgba(16, 185, 129, 0.4);
animation: celebration (on mastery);
```

### Layout Options

#### 1. Bento Grid Layout (Default)
- **Use Case:** Dashboard overview, domain-based exploration
- **Features:** Flexible sizing, visual clusters by domain
- **Node Sizes:**
  - Foundation/Core: 1×1 grid unit
  - Advanced: 1×2 (wider)
  - Expert: 2×2 (larger)
  - Capstone: 2×3 (prominent)

#### 2. Linear Pathway (Duolingo-style)
- **Use Case:** Guided learning, beginners
- **Features:** Clear progression, 3 nodes per row
- **Benefits:** Less overwhelming, focus on next step

#### 3. Branching Tree (Traditional)
- **Use Case:** Visual exploration, prerequisites visualization
- **Features:** Hierarchical layout, clear dependency paths
- **Benefits:** Shows full curriculum structure

### Responsive Design

**Desktop (1400px+):**
- 6-column bento grid
- 120px base node size
- Full tree view with zoom/pan

**Tablet (768px-1399px):**
- 4-column bento grid
- 100px base node size
- Domain-filtered views

**Mobile (<768px):**
- 2-column linear layout
- 80px base node size
- List view with status filters
- Pathway-focused navigation

---

## Implementation Guide

### Step 1: Create Skill Tree Definition

```typescript
import { SkillTree, SkillNodeType, SkillNodeStatus } from '@/lib/skill-tree';
import { createDefaultProgress } from '@/lib/skill-tree/progression';

const cardiologyTree: SkillTree = {
  metadata: {
    treeId: 'cardiology-core',
    version: '1.0.0',
    name: 'Cardiology Core Curriculum',
    description: 'Essential cardiology knowledge for medical students',
    domain: 'Cardiology',
    totalNodes: 15,
    totalXPAvailable: 12000,
    estimatedHoursToComplete: 20,
    difficulty: 'intermediate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  nodes: {
    'cardio-anatomy': {
      id: 'cardio-anatomy',
      loId: 'lo-cardio-001',
      title: 'Cardiac Anatomy',
      shortTitle: 'Anatomy',
      description: 'Master the structural anatomy of the heart',
      icon: '❤️',
      type: SkillNodeType.FOUNDATION,
      domain: 'Cardiology',
      tags: ['anatomy', 'foundation'],
      prerequisiteIds: [],
      recommendedAfter: [],
      unlocks: ['cardio-physiology', 'cardio-ekg-basics'],
      xpRequired: 0,
      minQuestionsToAttempt: 5,
      minQuestionsForMastery: 15,
      masteryThreshold: 1.5,
      status: SkillNodeStatus.AVAILABLE,
      progress: createDefaultProgress(),
      estimatedMinutes: 45,
      difficultyRating: 2,
      highYield: false,
      clinicalRelevance: 'Foundation for understanding cardiac pathology',
    },
    'cardio-heart-failure': {
      id: 'cardio-heart-failure',
      loId: 'lo-cardio-010',
      title: 'Acute Heart Failure',
      description: 'Diagnose and manage acute decompensated heart failure',
      icon: '💔',
      type: SkillNodeType.CORE,
      domain: 'Cardiology',
      tags: ['high-yield', 'clinical', 'board-exam'],
      prerequisiteIds: ['cardio-physiology', 'cardio-ekg-basics'],
      unlocks: ['cardio-cardiogenic-shock'],
      xpRequired: 1000,
      minQuestionsToAttempt: 10,
      minQuestionsForMastery: 25,
      masteryThreshold: 1.5,
      status: SkillNodeStatus.LOCKED,
      progress: createDefaultProgress(),
      estimatedMinutes: 90,
      difficultyRating: 7,
      highYield: true,
      clinicalRelevance: 'Common ED/ICU presentation requiring immediate management',
    },
    // ... more nodes
  },
  edges: [
    {
      fromNodeId: 'cardio-anatomy',
      toNodeId: 'cardio-physiology',
      relationshipType: 'required',
      strength: 1.0,
    },
    // ... more edges
  ],
  rootNodeIds: ['cardio-anatomy'],
  learnerProgress: {
    learnerId: 'local-dev',
    treeId: 'cardiology-core',
    nodesUnlocked: 0,
    nodesAttempted: 0,
    nodesMastered: 0,
    totalXPEarned: 0,
    totalMasteryPoints: 0,
    completionPercentage: 0,
    currentPath: [],
    recommendedNext: ['cardio-anatomy'],
    domains: [],
    milestones: [],
    startedAt: new Date().toISOString(),
    lastStudiedAt: new Date().toISOString(),
  },
};
```

### Step 2: Sync with Learner State

```typescript
import { syncSkillTreeFromLearnerState } from '@/lib/skill-tree';
import { loadLearnerState } from '@/lib/server/study-state';

// Load current learner state
const learnerState = await loadLearnerState('local-dev');

// Sync skill tree with latest progress
const syncedTree = syncSkillTreeFromLearnerState(learnerState, cardiologyTree);
```

### Step 3: Generate Layout

```typescript
import { generateBentoLayout } from '@/lib/skill-tree/layout';

// Generate bento grid layout
const layout = generateBentoLayout(syncedTree, {
  maxColumns: 6,
  nodeBaseSize: 120,
  gapSize: 16,
});

// For mobile
import { adaptLayoutForMobile } from '@/lib/skill-tree/layout';
const mobileLayout = adaptLayoutForMobile(layout);
```

### Step 4: Render UI Component

```typescript
'use client';

import { SkillTreeView } from '@/components/skill-tree/SkillTreeView';
import { useSkillTree } from '@/lib/hooks/useSkillTree';

export default function SkillTreePage() {
  const { tree, layout, isLoading } = useSkillTree('cardiology-core');

  if (isLoading) return <SkillTreeSkeleton />;

  return (
    <SkillTreeView
      tree={tree}
      layout={layout}
      viewMode="bento"
      onNodeClick={(nodeId) => {
        // Navigate to study session for this node
        router.push(`/study?focus=${nodeId}`);
      }}
    />
  );
}
```

### Step 5: Update Progress After Study Session

```typescript
import { updateSkillNodeProgress, determineSkillNodeStatus } from '@/lib/skill-tree';

// After a question is answered
const result = updateSkillNodeProgress(
  node.progress,
  node.type,
  {
    correct: true,
    timeSeconds: 12,
    confidenceLevel: 3,
  },
  irtState // From study engine
);

// Check for status change
const newStatus = determineSkillNodeStatus(
  node,
  prerequisites,
  learnerLevel,
  learnerTotalXP
);

// Award milestone XP if status improved
if (newStatus !== node.status) {
  const milestoneXP = awardNodeMilestoneXP(node.status, newStatus, node.type);
  // Update learner's total XP
}
```

---

## API Reference

### Core Functions

#### `syncSkillTreeFromLearnerState(learnerState, treeDefinition): SkillTree`
Syncs skill tree with latest learner state from IRT model.

#### `determineSkillNodeStatus(node, prerequisites, level, xp): SkillNodeStatus`
Computes current status based on progress and requirements.

#### `updateSkillNodeProgress(progress, nodeType, result, irtState): UpdateResult`
Updates node progress after a question attempt.

#### `getRecommendedNodes(nodes, level, xp, options): SkillNode[]`
Returns AI-recommended next nodes to study.

#### `generateBentoLayout(tree, options): SkillTreeLayout`
Generates bento grid layout for visual rendering.

#### `generateLinearPathwayLayout(tree, nodeIds, options): SkillTreeLayout`
Generates linear pathway layout (Duolingo-style).

#### `enrichSkillTreeWithAnalytics(tree, analytics): SkillTree`
Enriches tree with real-time analytics data.

### Utility Functions

#### `canUnlockNode(node, prerequisites, level, xp): boolean`
Checks if node unlock requirements are met.

#### `getUnlockedNodes(tree): SkillNode[]`
Returns all unlocked nodes.

#### `getStudyableNodes(tree): SkillNode[]`
Returns nodes available for immediate study.

#### `getReviewNodes(tree, currentTime): SkillNode[]`
Returns mastered nodes due for review.

#### `getCompletionStats(tree): CompletionStats`
Returns overall completion statistics.

---

## Design Principles

### 1. Progressive Disclosure
- Show only unlocked nodes initially
- Reveal locked nodes with clear unlock requirements
- Gradual complexity increase (Foundation → Capstone)

### 2. Clear Feedback
- Instant visual feedback on node interactions
- Progress bars show mastery points (0-100)
- Celebrations on status improvements

### 3. Multiple Pathways
- Support different learning styles (linear, exploratory)
- Domain-focused paths for specialists
- High-yield paths for board prep

### 4. Motivation & Engagement
- XP rewards tied to meaningful milestones
- Visual progression (status colors, glow effects)
- Achievements for domain mastery
- Streaks for consistency

### 5. Evidence-Based Progression
- IRT/Rasch model ensures accurate mastery assessment
- Spaced repetition for mastered nodes
- Analytics-driven recommendations

---

## Future Enhancements

### Phase 2: Social Features
- Leaderboards per domain
- Collaborative skill challenges
- Peer mastery verification

### Phase 3: Adaptive Paths
- AI-generated custom pathways
- Weak area detection & remediation
- Exam-focused sprint paths

### Phase 4: Advanced Gamification
- Skill tree "branches" (specializations)
- Prestige system (reset & replay with bonuses)
- Seasonal events & limited-time challenges

---

## References

**Research & Best Practices:**
- Khan Academy Mastery Learning System
- Duolingo's Learning Science & Gamification
- Codecademy Skill XP & Progressive Unlocking
- IRT (Item Response Theory) for Medical Education
- Spaced Repetition (FSRS) for Long-term Retention

**Implementation:**
- `/lib/types/skill-tree.ts` - Type definitions
- `/lib/skill-tree/progression.ts` - Status & XP logic
- `/lib/skill-tree/integration.ts` - System integrations
- `/lib/skill-tree/layout.ts` - Visual layouts

---

**Version:** 1.0.0
**Last Updated:** 2025-10-07
**Author:** Claude Code (Anthropic)
