/**
 * Skill Tree System for Medical Education Gamification
 *
 * Inspired by best practices from:
 * - Duolingo: Linear progression with prerequisites, daily goals, streaks
 * - Khan Academy: Mastery-based progression (Attempted → Familiar → Proficient → Mastered)
 * - Codecademy: Skill XP, progressive unlocking, clear milestones
 *
 * Integration Points:
 * - Maps to existing Learning Objectives (lo_ids)
 * - Integrates with XP/level system (lib/xp-system.ts)
 * - Tracks mastery via IRT/Rasch model (lib/study-engine.ts)
 * - Surfaces in dashboard analytics (lib/services/dashboardAnalytics.ts)
 */

import { z } from 'zod';

// ============================================================================
// SKILL NODE - Core unit of the skill tree
// ============================================================================

/**
 * Skill Node Status - Based on Khan Academy mastery levels
 *
 * @remarks
 * Progressive mastery system with 6 distinct states:
 *
 * 1. **LOCKED**: Prerequisites not met or insufficient XP/level
 * 2. **AVAILABLE**: Unlocked and ready to start
 * 3. **ATTEMPTED**: Started but accuracy <70% (0-49 mastery points)
 * 4. **FAMILIAR**: 70-89% accuracy (50-79 mastery points)
 * 5. **PROFICIENT**: 90%+ accuracy (80-99 mastery points)
 * 6. **MASTERED**: IRT mastery confirmed with 95%+ probability (100 mastery points)
 *
 * Status automatically advances as learner demonstrates competency through
 * the IRT/Rasch model. Mastery requires both high accuracy and statistical
 * confidence in the ability estimate.
 */
export enum SkillNodeStatus {
  LOCKED = 'locked',
  AVAILABLE = 'available',
  ATTEMPTED = 'attempted',
  FAMILIAR = 'familiar',
  PROFICIENT = 'proficient',
  MASTERED = 'mastered',
}

/**
 * Skill Node Type - Determines difficulty and XP rewards
 *
 * @remarks
 * Node types define difficulty progression and reward scaling:
 *
 * - **FOUNDATION**: Entry-level concepts (Level 1+, 5 XP/question)
 * - **CORE**: Standard medical knowledge (Level 3+, 10 XP/question)
 * - **ADVANCED**: Complex clinical reasoning (Level 8+, 15 XP/question)
 * - **EXPERT**: High-yield board-style questions (Level 15+, 20 XP/question)
 * - **CAPSTONE**: Integrative multi-LO challenges (Level 25+, 25 XP/question)
 *
 * Each type has progressively higher:
 * - Minimum level requirements
 * - XP rewards per question
 * - Milestone bonuses (1x to 3x multipliers)
 * - Difficulty ratings
 */
export enum SkillNodeType {
  FOUNDATION = 'foundation',
  CORE = 'core',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  CAPSTONE = 'capstone',
}

/**
 * Skill Node - Core unit representing a single skill/topic in the tree
 *
 * @remarks
 * Each skill node maps to a Learning Objective (LO) in the IRT system
 * and tracks granular progress toward mastery. Nodes are organized in
 * a directed acyclic graph (DAG) with prerequisite relationships.
 *
 * **Key Features:**
 * - Maps to existing Learning Objectives (lo_ids)
 * - Integrates with IRT/Rasch model for mastery tracking
 * - Progressive unlock system based on prerequisites and XP
 * - Real-time status updates as learner progresses
 * - Rich metadata for UI rendering and analytics
 *
 * @example
 * ```typescript
 * const node: SkillNode = {
 *   id: 'cardio-heart-failure',
 *   loId: 'LO-CARDIO-001',
 *   title: 'Congestive Heart Failure',
 *   description: 'Diagnosis and management of acute and chronic CHF',
 *   type: SkillNodeType.CORE,
 *   domain: 'Cardiology',
 *   status: SkillNodeStatus.AVAILABLE,
 *   progress: { ... },
 *   prerequisiteIds: ['cardio-basics'],
 *   xpRequired: 500,
 *   // ... other fields
 * };
 * ```
 */
export interface SkillNode {
  // Identity
  id: string;                           // Unique node ID (e.g., "cardio-heart-failure")
  loId: string;                         // Maps to Learning Objective ID from study engine

  // Display
  title: string;                        // User-facing name
  shortTitle?: string;                  // Abbreviated for compact views
  description: string;                  // What the learner will master
  icon?: string;                        // Emoji or icon identifier

  // Classification
  type: SkillNodeType;                  // Determines difficulty/rewards
  domain: string;                       // Medical domain (e.g., "Cardiology", "Pharmacology")
  tags: string[];                       // Additional categorization

  // Prerequisites & Dependencies
  prerequisiteIds: string[];            // Node IDs that must be mastered first
  recommendedAfter?: string[];          // Soft recommendations (not strict prerequisites)
  unlocks: string[];                    // Node IDs that this unlocks (computed)

  // Progression Requirements
  xpRequired: number;                   // XP needed to unlock (if prerequisites met)
  minQuestionsToAttempt: number;        // Min questions to reach "Attempted" status
  minQuestionsForMastery: number;       // Min questions for mastery consideration
  masteryThreshold: number;             // IRT theta threshold for mastery (default: 1.5)

  // Current State (per learner)
  status: SkillNodeStatus;              // Current mastery level
  progress: SkillNodeProgress;          // Detailed progress tracking

  // Metadata
  estimatedMinutes: number;             // Expected time to master
  difficultyRating: number;             // 1-10 scale for learner guidance
  highYield: boolean;                   // Flagged as board-exam critical
  clinicalRelevance: string;            // Real-world application context

  // Timestamps
  firstAttemptedAt?: string;            // ISO timestamp
  masteredAt?: string;                  // ISO timestamp when mastered
  lastReviewedAt?: string;              // Most recent study session
}

/**
 * Skill Node Progress - Detailed tracking of learner's advancement
 *
 * @remarks
 * Comprehensive progress tracking that combines:
 * - **Question Metrics**: Attempts, accuracy, correctness
 * - **IRT State**: Theta estimates, standard error, mastery probability
 * - **Gamification**: XP earned, mastery points (0-100)
 * - **Engagement**: Study sessions, time spent, streaks
 * - **Retention**: FSRS-based memory strength and review scheduling
 *
 * Progress is automatically synchronized with the IRT model after each
 * question attempt, ensuring real-time mastery assessment.
 *
 * @example
 * ```typescript
 * const progress: SkillNodeProgress = {
 *   questionsAttempted: 15,
 *   questionsCorrect: 13,
 *   currentAccuracy: 86.7,
 *   thetaHat: 1.2,
 *   standardError: 0.35,
 *   masteryProbability: 0.82,
 *   xpEarned: 450,
 *   masteryPoints: 75, // Familiar status
 *   studySessions: 3,
 *   totalStudyTimeMs: 1800000,
 *   streakDays: 5,
 * };
 * ```
 */
export interface SkillNodeProgress {
  // Question-level metrics
  questionsAttempted: number;
  questionsCorrect: number;
  currentAccuracy: number;              // Percentage (0-100)

  // Mastery tracking (from IRT model)
  thetaHat: number;                     // Current ability estimate
  standardError: number;                // Confidence in estimate
  masteryProbability: number;           // P(theta > threshold) from Rasch model

  // XP & Rewards
  xpEarned: number;                     // Total XP from this node
  masteryPoints: number;                // 0-100, based on Khan Academy system

  // Engagement
  studySessions: number;                // Number of sessions on this node
  totalStudyTimeMs: number;             // Cumulative study time
  streakDays: number;                   // Consecutive days studied

  // Retention (for mastered nodes)
  retentionStrength?: number;           // FSRS-based retention metric
  nextReviewDue?: string;               // ISO timestamp for spaced repetition
  lapseCount?: number;                  // Times dropped below mastery
}

// Zod schemas for validation
export const skillNodeStatusSchema = z.nativeEnum(SkillNodeStatus);
export const skillNodeTypeSchema = z.nativeEnum(SkillNodeType);

export const skillNodeProgressSchema = z.object({
  questionsAttempted: z.number().int().nonnegative(),
  questionsCorrect: z.number().int().nonnegative(),
  currentAccuracy: z.number().min(0).max(100),
  thetaHat: z.number(),
  standardError: z.number().positive(),
  masteryProbability: z.number().min(0).max(1),
  xpEarned: z.number().int().nonnegative(),
  masteryPoints: z.number().int().min(0).max(100),
  studySessions: z.number().int().nonnegative(),
  totalStudyTimeMs: z.number().int().nonnegative(),
  streakDays: z.number().int().nonnegative(),
  retentionStrength: z.number().min(0).max(1).optional(),
  nextReviewDue: z.string().optional(),
  lapseCount: z.number().int().nonnegative().optional(),
});

export const skillNodeSchema = z.object({
  id: z.string().min(1),
  loId: z.string().min(1),
  title: z.string().min(1),
  shortTitle: z.string().optional(),
  description: z.string().min(1),
  icon: z.string().optional(),
  type: skillNodeTypeSchema,
  domain: z.string().min(1),
  tags: z.array(z.string()),
  prerequisiteIds: z.array(z.string()),
  recommendedAfter: z.array(z.string()).optional(),
  unlocks: z.array(z.string()),
  xpRequired: z.number().int().nonnegative(),
  minQuestionsToAttempt: z.number().int().positive(),
  minQuestionsForMastery: z.number().int().positive(),
  masteryThreshold: z.number().positive(),
  status: skillNodeStatusSchema,
  progress: skillNodeProgressSchema,
  estimatedMinutes: z.number().int().positive(),
  difficultyRating: z.number().int().min(1).max(10),
  highYield: z.boolean(),
  clinicalRelevance: z.string(),
  firstAttemptedAt: z.string().optional(),
  masteredAt: z.string().optional(),
  lastReviewedAt: z.string().optional(),
});

// ============================================================================
// SKILL TREE - Complete tree structure
// ============================================================================

/**
 * Skill Tree Edge - Represents dependency relationships
 */
export interface SkillTreeEdge {
  fromNodeId: string;                   // Prerequisite node
  toNodeId: string;                     // Dependent node
  relationshipType: 'required' | 'recommended';
  strength: number;                     // 0-1, indicates importance
}

/**
 * Skill Tree Metadata
 */
export interface SkillTreeMetadata {
  treeId: string;                       // Unique identifier
  version: string;                      // Schema version
  name: string;                         // Display name (e.g., "Internal Medicine Core")
  description: string;
  domain: string;                       // Medical specialty
  totalNodes: number;
  totalXPAvailable: number;             // Sum of all node XP
  estimatedHoursToComplete: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certificationPath?: string;           // Optional (e.g., "USMLE Step 1")
  createdAt: string;
  updatedAt: string;
}

/**
 * Skill Tree - Complete structure with all nodes and edges
 */
export interface SkillTree {
  metadata: SkillTreeMetadata;
  nodes: Record<string, SkillNode>;     // Keyed by node ID
  edges: SkillTreeEdge[];
  rootNodeIds: string[];                // Entry points (no prerequisites)

  // Learner-specific state
  learnerProgress: LearnerSkillTreeProgress;
}

/**
 * Learner Skill Tree Progress - Per-learner tracking
 */
export interface LearnerSkillTreeProgress {
  learnerId: string;
  treeId: string;

  // Overall metrics
  nodesUnlocked: number;
  nodesAttempted: number;
  nodesMastered: number;
  totalXPEarned: number;
  totalMasteryPoints: number;           // Sum of all node mastery points
  completionPercentage: number;         // (nodesMastered / totalNodes) * 100

  // Current state
  currentPath: string[];                // Ordered list of node IDs in progress
  recommendedNext: string[];            // AI-recommended next nodes

  // Achievements
  domains: DomainProgress[];            // Progress per medical domain
  milestones: Milestone[];              // Major achievements unlocked

  // Timestamps
  startedAt: string;
  lastStudiedAt: string;
  projectedCompletionDate?: string;     // Based on current pace
}

export interface DomainProgress {
  domain: string;
  nodesTotal: number;
  nodesMastered: number;
  percentComplete: number;
  averageAccuracy: number;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
  xpBonus: number;
}

// ============================================================================
// SKILL TREE LAYOUT - Visual positioning for bento grid
// ============================================================================

/**
 * Layout Position - Grid coordinates for visual rendering
 */
export interface LayoutPosition {
  nodeId: string;

  // Grid position (bento layout)
  row: number;                          // Y coordinate
  column: number;                       // X coordinate
  layer: number;                        // Z-index for overlapping paths

  // Size
  span: {
    rows: number;                       // Height in grid units
    columns: number;                    // Width in grid units
  };

  // Visual hints
  highlight: boolean;                   // Draw attention (recommended next)
  pulse: boolean;                       // Animate for urgency
  connectionPoints: {                   // For drawing edges
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
}

/**
 * Skill Tree Layout - Visual organization for UI rendering
 */
export interface SkillTreeLayout {
  treeId: string;
  layoutType: 'linear' | 'branching' | 'web' | 'hybrid';
  gridConfig: {
    rows: number;                       // Total grid height
    columns: number;                    // Total grid width
    gapSize: number;                    // Spacing between nodes (px)
    nodeBaseSize: number;               // Default node size (px)
  };
  positions: Record<string, LayoutPosition>; // Keyed by node ID

  // Visual grouping
  domainClusters: DomainCluster[];      // Organize nodes by medical domain
  pathways: LearningPathway[];          // Curated learning sequences

  // Viewport hints for mobile
  viewport: {
    defaultZoom: number;
    focusNodeId?: string;               // Center on this node initially
    minZoom: number;
    maxZoom: number;
  };
}

export interface DomainCluster {
  domain: string;
  nodeIds: string[];
  centerPosition: { row: number; column: number };
  color: string;                        // Theme color for visual grouping
  icon: string;
}

export interface LearningPathway {
  id: string;
  name: string;
  description: string;
  nodeIds: string[];                    // Ordered sequence
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  highYield: boolean;
}

// ============================================================================
// XP & UNLOCK MECHANICS
// ============================================================================

/**
 * XP Rewards by Node Type
 */
export const SKILL_NODE_XP_REWARDS: Record<SkillNodeType, {
  perQuestion: number;
  firstAttempt: number;
  reachFamiliar: number;
  reachProficient: number;
  reachMastered: number;
  perfectAccuracy: number;
  speedBonus: number;
}> = {
  [SkillNodeType.FOUNDATION]: {
    perQuestion: 5,
    firstAttempt: 25,
    reachFamiliar: 50,
    reachProficient: 100,
    reachMastered: 250,
    perfectAccuracy: 100,
    speedBonus: 25,
  },
  [SkillNodeType.CORE]: {
    perQuestion: 10,
    firstAttempt: 50,
    reachFamiliar: 100,
    reachProficient: 200,
    reachMastered: 500,
    perfectAccuracy: 200,
    speedBonus: 50,
  },
  [SkillNodeType.ADVANCED]: {
    perQuestion: 15,
    firstAttempt: 75,
    reachFamiliar: 150,
    reachProficient: 300,
    reachMastered: 750,
    perfectAccuracy: 300,
    speedBonus: 75,
  },
  [SkillNodeType.EXPERT]: {
    perQuestion: 20,
    firstAttempt: 100,
    reachFamiliar: 200,
    reachProficient: 400,
    reachMastered: 1000,
    perfectAccuracy: 400,
    speedBonus: 100,
  },
  [SkillNodeType.CAPSTONE]: {
    perQuestion: 25,
    firstAttempt: 150,
    reachFamiliar: 300,
    reachProficient: 600,
    reachMastered: 1500,
    perfectAccuracy: 600,
    speedBonus: 150,
  },
};

/**
 * Unlock Requirements
 */
export interface UnlockRequirements {
  // XP requirements
  minLevel: number;                     // From global XP system
  xpRequired: number;                   // Node-specific XP threshold

  // Mastery requirements
  prerequisitesAllMastered: boolean;
  prerequisitesMasteryPoints: number;   // Min total mastery points from prerequisites

  // Additional gates
  minTotalQuestionsAnswered: number;    // Platform-wide threshold
  domainExperience?: {                  // Domain-specific requirements
    domain: string;
    minNodesMastered: number;
  };

  // Time-based (optional)
  daysActive?: number;                  // Account age requirement
  streakRequired?: number;              // Study streak requirement
}

/**
 * Node State Colors for Visual Design
 */
export const SKILL_NODE_COLORS = {
  [SkillNodeStatus.LOCKED]: {
    background: 'rgba(156, 163, 175, 0.2)',      // gray-400 with opacity
    border: 'rgba(156, 163, 175, 0.4)',
    text: 'rgba(156, 163, 175, 1)',
    icon: 'rgba(156, 163, 175, 0.6)',
    glow: 'none',
  },
  [SkillNodeStatus.AVAILABLE]: {
    background: 'rgba(59, 130, 246, 0.1)',       // blue-500 (var(--accent-trust))
    border: 'rgba(59, 130, 246, 0.4)',
    text: 'rgba(59, 130, 246, 1)',
    icon: 'rgba(59, 130, 246, 1)',
    glow: '0 0 20px rgba(59, 130, 246, 0.3)',
  },
  [SkillNodeStatus.ATTEMPTED]: {
    background: 'rgba(245, 158, 11, 0.1)',       // amber-500 (var(--warning))
    border: 'rgba(245, 158, 11, 0.4)',
    text: 'rgba(245, 158, 11, 1)',
    icon: 'rgba(245, 158, 11, 1)',
    glow: 'none',
  },
  [SkillNodeStatus.FAMILIAR]: {
    background: 'rgba(59, 130, 246, 0.15)',      // blue-500
    border: 'rgba(59, 130, 246, 0.6)',
    text: 'rgba(59, 130, 246, 1)',
    icon: 'rgba(59, 130, 246, 1)',
    glow: '0 0 15px rgba(59, 130, 246, 0.2)',
  },
  [SkillNodeStatus.PROFICIENT]: {
    background: 'rgba(139, 92, 246, 0.15)',      // violet-500 (var(--accent-mastery))
    border: 'rgba(139, 92, 246, 0.6)',
    text: 'rgba(139, 92, 246, 1)',
    icon: 'rgba(139, 92, 246, 1)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  [SkillNodeStatus.MASTERED]: {
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(245, 158, 11, 0.2))', // green-500 to gold
    border: 'rgba(16, 185, 129, 0.8)',
    text: 'rgba(16, 185, 129, 1)',
    icon: 'rgba(245, 158, 11, 1)',                // Gold icon for mastery
    glow: '0 0 30px rgba(16, 185, 129, 0.4)',
  },
} as const;

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SkillTreeFilter = {
  status?: SkillNodeStatus[];
  type?: SkillNodeType[];
  domain?: string[];
  highYieldOnly?: boolean;
  minDifficulty?: number;
  maxDifficulty?: number;
};

export type SkillTreeSortKey =
  | 'recommended'                       // AI-driven recommendation
  | 'difficulty-asc'
  | 'difficulty-desc'
  | 'mastery-asc'
  | 'mastery-desc'
  | 'xp-potential-desc'
  | 'time-to-complete-asc'
  | 'alphabetical';

export type SkillTreeView =
  | 'tree'                              // Full visual tree
  | 'list'                              // Linear list view
  | 'grid'                              // Bento grid cards
  | 'pathway'                           // Follow a specific learning path
  | 'domain';                           // Group by medical domain
