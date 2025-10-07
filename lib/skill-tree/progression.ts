/**
 * Skill Tree Progression Engine
 *
 * Handles:
 * - Status transitions (locked → available → attempted → familiar → proficient → mastered)
 * - XP rewards and unlock mechanics
 * - Mastery calculations from IRT/Rasch model
 * - Retention tracking and spaced repetition integration
 */

import {
  SkillNode,
  SkillNodeStatus,
  SkillNodeType,
  SkillNodeProgress,
  SKILL_NODE_XP_REWARDS,
  UnlockRequirements,
} from '../types/skill-tree';
import { LearnerLoState } from '../study-engine';
import { masteryProbability } from '../engine/shims/rasch';
import { getLevelFromXP } from '../xp-system';

// ============================================================================
// STATUS DETERMINATION
// ============================================================================

/**
 * Determine skill node status based on progress and prerequisites
 *
 * @param node - Skill node to evaluate
 * @param prerequisites - Array of prerequisite nodes
 * @param learnerLevel - Current learner level
 * @param learnerTotalXP - Total XP earned by learner
 * @returns Current status of the skill node
 *
 * @remarks
 * Status is determined by evaluating multiple criteria in order:
 *
 * 1. **LOCKED**: Prerequisites not met OR insufficient XP/level
 * 2. **MASTERED**: ≥95% mastery probability + sufficient questions
 * 3. **PROFICIENT**: ≥90% accuracy + ≥80% mastery probability
 * 4. **FAMILIAR**: ≥70% accuracy + minimum questions attempted
 * 5. **ATTEMPTED**: Minimum questions attempted but <70% accuracy
 * 6. **AVAILABLE**: Unlocked but not yet started
 *
 * This function should be called:
 * - After each question attempt
 * - When checking if a node can be unlocked
 * - When syncing the skill tree with learner state
 *
 * @example
 * ```typescript
 * const status = determineSkillNodeStatus(
 *   node,
 *   prerequisites,
 *   learnerLevel,
 *   learnerTotalXP
 * );
 *
 * if (status === SkillNodeStatus.MASTERED) {
 *   // Award mastery bonus, unlock dependent nodes
 * }
 * ```
 */
export function determineSkillNodeStatus(
  node: SkillNode,
  prerequisites: SkillNode[],
  learnerLevel: number,
  learnerTotalXP: number
): SkillNodeStatus {
  // Check if locked
  if (!canUnlockNode(node, prerequisites, learnerLevel, learnerTotalXP)) {
    return SkillNodeStatus.LOCKED;
  }

  // Check mastery conditions
  const progress = node.progress;

  // Mastered: IRT mastery confirmed + sufficient questions
  if (
    progress.questionsAttempted >= node.minQuestionsForMastery &&
    progress.masteryProbability >= 0.95 && // 95% confidence in mastery
    progress.thetaHat >= node.masteryThreshold
  ) {
    return SkillNodeStatus.MASTERED;
  }

  // Proficient: High accuracy and approaching mastery
  if (
    progress.questionsAttempted >= node.minQuestionsForMastery &&
    progress.currentAccuracy >= 90 &&
    progress.masteryProbability >= 0.80
  ) {
    return SkillNodeStatus.PROFICIENT;
  }

  // Familiar: Moderate accuracy
  if (
    progress.questionsAttempted >= node.minQuestionsToAttempt &&
    progress.currentAccuracy >= 70
  ) {
    return SkillNodeStatus.FAMILIAR;
  }

  // Attempted: Started but not yet familiar
  if (progress.questionsAttempted >= node.minQuestionsToAttempt) {
    return SkillNodeStatus.ATTEMPTED;
  }

  // Available: Unlocked but not yet attempted
  return SkillNodeStatus.AVAILABLE;
}

/**
 * Check if node can be unlocked
 *
 * @param node - Skill node to check
 * @param prerequisites - Array of prerequisite nodes
 * @param learnerLevel - Current learner level
 * @param learnerTotalXP - Total XP earned by learner
 * @returns true if node can be unlocked, false otherwise
 *
 * @remarks
 * A node can be unlocked if ALL of the following conditions are met:
 * 1. Learner has earned enough total XP (node.xpRequired)
 * 2. Learner level meets minimum for node type
 * 3. ALL prerequisite nodes are mastered
 *
 * Minimum levels by type:
 * - Foundation: Level 1 (always accessible)
 * - Core: Level 3
 * - Advanced: Level 8
 * - Expert: Level 15
 * - Capstone: Level 25
 *
 * @example
 * ```typescript
 * if (canUnlockNode(node, prerequisites, level, totalXP)) {
 *   // Show "Start" button in UI
 * } else {
 *   // Show lock icon with requirements
 * }
 * ```
 */
export function canUnlockNode(
  node: SkillNode,
  prerequisites: SkillNode[],
  learnerLevel: number,
  learnerTotalXP: number
): boolean {
  // Check XP requirement
  if (learnerTotalXP < node.xpRequired) {
    return false;
  }

  // Check level requirement (derived from node type)
  const minLevel = getMinLevelForNodeType(node.type);
  if (learnerLevel < minLevel) {
    return false;
  }

  // Check all prerequisites are mastered
  for (const prereq of prerequisites) {
    if (prereq.status !== SkillNodeStatus.MASTERED) {
      return false;
    }
  }

  return true;
}

/**
 * Get minimum level required for node type
 *
 * @param type - Skill node type
 * @returns Minimum learner level required to unlock
 *
 * @remarks
 * - Foundation: Level 1 (always accessible)
 * - Core: Level 3
 * - Advanced: Level 8
 * - Expert: Level 15
 * - Capstone: Level 25
 */
export function getMinLevelForNodeType(type: SkillNodeType): number {
  switch (type) {
    case SkillNodeType.FOUNDATION:
      return 1;
    case SkillNodeType.CORE:
      return 3;
    case SkillNodeType.ADVANCED:
      return 8;
    case SkillNodeType.EXPERT:
      return 15;
    case SkillNodeType.CAPSTONE:
      return 25;
    default:
      return 1;
  }
}

// ============================================================================
// PROGRESS UPDATES
// ============================================================================

/**
 * Update skill node progress after a question attempt
 *
 * @param currentProgress - Current progress state before this attempt
 * @param nodeType - Type of skill node
 * @param questionResult - Result of the question attempt
 * @param irtState - Updated IRT state from the Rasch model
 * @returns Object containing updated progress, XP earned, and status change info
 *
 * @remarks
 * This function updates all progress metrics after a question attempt:
 *
 * **Updated Metrics:**
 * - Questions attempted/correct
 * - Current accuracy percentage
 * - IRT estimates (theta, SE, mastery probability)
 * - Mastery points (0-100 scale)
 * - XP earned (with bonuses)
 * - Study time
 *
 * **XP Calculation includes:**
 * - Base XP per question (varies by node type)
 * - Speed bonus (if answered <10s)
 * - First attempt bonus
 * - Status transition bonuses
 * - Perfect accuracy bonus
 *
 * Caller should check statusChanged and recompute node status.
 *
 * @example
 * ```typescript
 * const result = updateSkillNodeProgress(
 *   node.progress,
 *   node.type,
 *   { correct: true, timeSeconds: 7 },
 *   { thetaHat: 1.3, se: 0.4 }
 * );
 *
 * // Update node with new progress
 * node.progress = result.updatedProgress;
 * // Award XP to learner
 * gamification.totalXP += result.xpEarned;
 * ```
 */
export function updateSkillNodeProgress(
  currentProgress: SkillNodeProgress,
  nodeType: SkillNodeType,
  questionResult: {
    correct: boolean;
    timeSeconds: number;
    confidenceLevel?: number;
  },
  irtState: LearnerLoState
): {
  updatedProgress: SkillNodeProgress;
  xpEarned: number;
  statusChanged: boolean;
  newStatus?: SkillNodeStatus;
} {
  const { correct, timeSeconds } = questionResult;

  // Update basic metrics
  const questionsAttempted = currentProgress.questionsAttempted + 1;
  const questionsCorrect = currentProgress.questionsCorrect + (correct ? 1 : 0);
  const currentAccuracy = (questionsCorrect / questionsAttempted) * 100;

  // Update IRT metrics from study engine
  const thetaHat = irtState.thetaHat;
  const standardError = irtState.se;
  const masteryProb = masteryProbability(thetaHat, standardError, 1.5); // Default threshold

  // Calculate mastery points (0-100, Khan Academy style)
  const masteryPoints = calculateMasteryPoints(
    currentAccuracy,
    masteryProb,
    questionsAttempted
  );

  // Calculate XP earned
  const xpEarned = calculateXPReward(
    nodeType,
    correct,
    timeSeconds,
    currentProgress,
    questionsAttempted
  );

  // Updated progress
  const updatedProgress: SkillNodeProgress = {
    questionsAttempted,
    questionsCorrect,
    currentAccuracy,
    thetaHat,
    standardError,
    masteryProbability: masteryProb,
    xpEarned: currentProgress.xpEarned + xpEarned,
    masteryPoints,
    studySessions: currentProgress.studySessions,
    totalStudyTimeMs: currentProgress.totalStudyTimeMs + timeSeconds * 1000,
    streakDays: currentProgress.streakDays,
    retentionStrength: currentProgress.retentionStrength,
    nextReviewDue: currentProgress.nextReviewDue,
    lapseCount: currentProgress.lapseCount,
  };

  return {
    updatedProgress,
    xpEarned,
    statusChanged: false, // Caller should recompute status
  };
}

/**
 * Calculate mastery points (0-100) based on Khan Academy system
 *
 * @param accuracy - Current accuracy percentage (0-100)
 * @param masteryProbability - IRT-based mastery probability (0-1)
 * @param questionsAttempted - Total number of questions attempted
 * @returns Mastery points from 0-100
 *
 * @remarks
 * - 0-49 points: Attempted (<70% accuracy)
 * - 50-79 points: Familiar (70-89% accuracy)
 * - 80-99 points: Proficient (90%+ accuracy)
 * - 100 points: Mastered (95%+ mastery probability)
 */
export function calculateMasteryPoints(
  accuracy: number,
  masteryProbability: number,
  questionsAttempted: number
): number {
  // Not started
  if (questionsAttempted === 0) return 0;

  // Attempted (<70% accuracy) = 0-49 points
  if (accuracy < 70) {
    return Math.floor((accuracy / 70) * 49);
  }

  // Familiar (70-89% accuracy) = 50-79 points
  if (accuracy < 90) {
    const familiarProgress = (accuracy - 70) / 20; // 0-1
    return 50 + Math.floor(familiarProgress * 29);
  }

  // Proficient (90%+ accuracy) = 80-99 points
  if (masteryProbability < 0.95) {
    const proficientProgress = masteryProbability / 0.95; // 0-1
    return 80 + Math.floor(proficientProgress * 19);
  }

  // Mastered (95%+ mastery probability) = 100 points
  return 100;
}

/**
 * Calculate XP reward for a question attempt
 *
 * @param nodeType - Type of skill node (Foundation, Core, Advanced, Expert, Capstone)
 * @param correct - Whether the answer was correct
 * @param timeSeconds - Time taken to answer in seconds
 * @param currentProgress - Current progress state before this attempt
 * @param newQuestionCount - Total questions attempted after this one
 * @returns XP earned for this attempt
 *
 * @remarks
 * Includes:
 * - Base XP per question (varies by node type)
 * - Speed bonus for answers <10s
 * - Milestone bonuses (first attempt, status transitions)
 * - Perfect accuracy bonus (100% at 10+ questions)
 */
export function calculateXPReward(
  nodeType: SkillNodeType,
  correct: boolean,
  timeSeconds: number,
  currentProgress: SkillNodeProgress,
  newQuestionCount: number
): number {
  const rewards = SKILL_NODE_XP_REWARDS[nodeType];

  let xp = 0;

  // Base reward per question
  if (correct) {
    xp += rewards.perQuestion;

    // Speed bonus (if answered in <10s)
    if (timeSeconds < 10) {
      xp += rewards.speedBonus;
    }
  } else {
    // Small reward for trying (encourage learning from mistakes)
    xp += Math.floor(rewards.perQuestion * 0.2);
  }

  // Milestone bonuses
  if (newQuestionCount === 1) {
    // First attempt on this node
    xp += rewards.firstAttempt;
  }

  // Status transition bonuses (checked by caller)
  const oldMasteryPoints = currentProgress.masteryPoints;
  const newMasteryPoints = calculateMasteryPoints(
    (currentProgress.questionsCorrect + (correct ? 1 : 0)) / newQuestionCount * 100,
    currentProgress.masteryProbability,
    newQuestionCount
  );

  if (oldMasteryPoints < 50 && newMasteryPoints >= 50) {
    xp += rewards.reachFamiliar;
  }
  if (oldMasteryPoints < 80 && newMasteryPoints >= 80) {
    xp += rewards.reachProficient;
  }
  if (oldMasteryPoints < 100 && newMasteryPoints >= 100) {
    xp += rewards.reachMastered;
  }

  // Perfect accuracy bonus (100% for 10+ questions)
  if (newQuestionCount >= 10 && newMasteryPoints === 100) {
    const allCorrect = (currentProgress.questionsCorrect + (correct ? 1 : 0)) === newQuestionCount;
    if (allCorrect) {
      xp += rewards.perfectAccuracy;
    }
  }

  return xp;
}

// ============================================================================
// MILESTONE XP REWARDS
// ============================================================================

/**
 * Award bonus XP when a node reaches a new status milestone
 *
 * @param oldStatus - Previous status
 * @param newStatus - New status achieved
 * @param nodeType - Type of skill node
 * @returns Bonus XP earned for the milestone
 *
 * @remarks
 * Milestone bonuses are progressive:
 * - First Attempt: 25-150 XP (based on node type)
 * - Familiar: 50-300 XP
 * - Proficient: 100-600 XP
 * - Mastered: 250-1500 XP
 *
 * XP scales with node type using multipliers:
 * - Foundation: 1x
 * - Core: 1.5x
 * - Advanced: 2x
 * - Expert: 2.5x
 * - Capstone: 3x
 */
export function awardMilestoneXP(
  oldStatus: SkillNodeStatus,
  newStatus: SkillNodeStatus,
  nodeType: SkillNodeType
): number {
  // No XP if status didn't improve
  const statusOrder = [
    SkillNodeStatus.LOCKED,
    SkillNodeStatus.AVAILABLE,
    SkillNodeStatus.ATTEMPTED,
    SkillNodeStatus.FAMILIAR,
    SkillNodeStatus.PROFICIENT,
    SkillNodeStatus.MASTERED,
  ];

  const oldIndex = statusOrder.indexOf(oldStatus);
  const newIndex = statusOrder.indexOf(newStatus);

  if (newIndex <= oldIndex) return 0;

  // Base XP rewards per status milestone
  const baseRewards = {
    [SkillNodeStatus.LOCKED]: 0,
    [SkillNodeStatus.AVAILABLE]: 0,
    [SkillNodeStatus.ATTEMPTED]: 50,
    [SkillNodeStatus.FAMILIAR]: 150,
    [SkillNodeStatus.PROFICIENT]: 300,
    [SkillNodeStatus.MASTERED]: 1000,
  };

  // Node type multipliers
  const multipliers = {
    [SkillNodeType.FOUNDATION]: 1.0,
    [SkillNodeType.CORE]: 1.5,
    [SkillNodeType.ADVANCED]: 2.0,
    [SkillNodeType.EXPERT]: 2.5,
    [SkillNodeType.CAPSTONE]: 3.0,
  };

  const baseXP = baseRewards[newStatus] ?? 0;
  const multiplier = multipliers[nodeType] ?? 1.0;

  return Math.floor(baseXP * multiplier);
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * Get recommended next nodes based on current progress
 *
 * @param allNodes - All nodes in the skill tree
 * @param learnerLevel - Current learner level
 * @param learnerTotalXP - Total XP earned
 * @param options - Optional configuration for recommendations
 * @returns Array of recommended nodes, sorted by priority
 *
 * @remarks
 * Recommendation algorithm scores available nodes based on:
 * - **Difficulty**: Prefer easier nodes (higher base score)
 * - **XP Potential**: Higher XP = more attractive
 * - **High Yield**: Bonus if prioritizeHighYield is true
 * - **Domain Focus**: Bonus for matching focusDomains
 * - **Prerequisites**: Prefer foundational nodes
 * - **Time**: Prefer shorter estimated time
 * - **Type Priority**: Foundation > Core > Advanced > Expert > Capstone
 *
 * Only considers nodes with status === AVAILABLE.
 *
 * @example
 * ```typescript
 * const recommended = getRecommendedNodes(
 *   Object.values(skillTree.nodes),
 *   learnerLevel,
 *   learnerTotalXP,
 *   {
 *     maxRecommendations: 5,
 *     prioritizeHighYield: true,
 *     focusDomains: ['Cardiology', 'Pharmacology'],
 *   }
 * );
 *
 * // Display as "Recommended For You" section
 * ```
 */
export function getRecommendedNodes(
  allNodes: SkillNode[],
  learnerLevel: number,
  learnerTotalXP: number,
  options?: {
    maxRecommendations?: number;
    prioritizeHighYield?: boolean;
    focusDomains?: string[];
  }
): SkillNode[] {
  const maxRecs = options?.maxRecommendations ?? 5;
  const prioritizeHighYield = options?.prioritizeHighYield ?? false;
  const focusDomains = options?.focusDomains ?? [];

  // Filter to available nodes
  const availableNodes = allNodes.filter(
    (node) => node.status === SkillNodeStatus.AVAILABLE
  );

  // Score each node
  const scoredNodes = availableNodes.map((node) => {
    let score = 0;

    // Base score from difficulty (prefer easier nodes)
    score += (11 - node.difficultyRating) * 5;

    // XP potential
    score += node.xpRequired / 100;

    // High yield bonus
    if (prioritizeHighYield && node.highYield) {
      score += 50;
    }

    // Domain focus
    if (focusDomains.length > 0 && focusDomains.includes(node.domain)) {
      score += 30;
    }

    // Prefer nodes with fewer prerequisites (more foundational)
    score += (5 - Math.min(node.prerequisiteIds.length, 5)) * 10;

    // Prefer shorter estimated time
    score += (120 - Math.min(node.estimatedMinutes, 120)) / 10;

    // Boost foundation and core nodes
    if (node.type === SkillNodeType.FOUNDATION) score += 40;
    if (node.type === SkillNodeType.CORE) score += 20;

    return { node, score };
  });

  // Sort by score and return top N
  scoredNodes.sort((a, b) => b.score - a.score);
  return scoredNodes.slice(0, maxRecs).map((item) => item.node);
}

/**
 * Check if node should be marked for review (retention-based)
 *
 * @param node - Skill node to check
 * @param currentTime - Current date/time (defaults to now)
 * @returns true if node is due for review, false otherwise
 *
 * @remarks
 * Uses spaced repetition logic to determine if a mastered node
 * needs review to maintain retention. Only mastered nodes with
 * a scheduled nextReviewDue date are considered.
 *
 * Integrates with FSRS (Free Spaced Repetition Scheduler) for
 * optimal review scheduling based on memory strength.
 *
 * @example
 * ```typescript
 * const dueForReview = skillTree.nodes
 *   .filter(node => shouldReviewNode(node, new Date()));
 *
 * // Show "Review" section with these nodes
 * ```
 */
export function shouldReviewNode(node: SkillNode, currentTime: Date): boolean {
  if (node.status !== SkillNodeStatus.MASTERED) {
    return false;
  }

  const progress = node.progress;
  if (!progress.nextReviewDue) {
    return false;
  }

  const reviewDue = new Date(progress.nextReviewDue);
  return currentTime >= reviewDue;
}

// ============================================================================
// UNLOCK REQUIREMENTS GENERATION
// ============================================================================

/**
 * Generate unlock requirements for a node
 *
 * @param node - Skill node to generate requirements for
 * @param prerequisites - Array of prerequisite nodes
 * @returns Structured unlock requirements object
 *
 * @remarks
 * Computes comprehensive unlock requirements including:
 * - Minimum level based on node type
 * - XP threshold from node definition
 * - Prerequisite mastery requirements
 * - Domain experience (for advanced nodes)
 * - Platform-wide question thresholds (for expert nodes)
 *
 * Use this to display lock states in the UI with clear
 * requirements for unlocking.
 *
 * @example
 * ```typescript
 * const requirements = generateUnlockRequirements(node, prerequisites);
 *
 * // Display in UI:
 * // "Unlock Requirements:"
 * // "- Reach Level {requirements.minLevel}"
 * // "- Earn {requirements.xpRequired} XP"
 * // "- Master all prerequisites"
 * ```
 */
export function generateUnlockRequirements(
  node: SkillNode,
  prerequisites: SkillNode[]
): UnlockRequirements {
  const minLevel = getMinLevelForNodeType(node.type);

  // Calculate prerequisite mastery points requirement
  const prereqMasteryPoints = prerequisites.length > 0
    ? Math.floor(prerequisites.length * 80) // Avg 80 points per prereq
    : 0;

  // Domain experience requirement (for advanced+ nodes)
  let domainExperience: UnlockRequirements['domainExperience'] | undefined;
  if (node.type === SkillNodeType.ADVANCED || node.type === SkillNodeType.EXPERT || node.type === SkillNodeType.CAPSTONE) {
    domainExperience = {
      domain: node.domain,
      minNodesMastered: node.type === SkillNodeType.CAPSTONE ? 10 : 5,
    };
  }

  return {
    minLevel,
    xpRequired: node.xpRequired,
    prerequisitesAllMastered: true,
    prerequisitesMasteryPoints: prereqMasteryPoints,
    minTotalQuestionsAnswered: node.type === SkillNodeType.EXPERT ? 200 : 0,
    domainExperience,
  };
}

// ============================================================================
// PROGRESS INITIALIZATION
// ============================================================================

/**
 * Create default progress for a new node
 *
 * @returns Initialized progress object with zero values
 *
 * @remarks
 * Use this when creating a new skill tree or initializing
 * a node that hasn't been attempted yet. All metrics start
 * at zero except standardError (0.8, indicating high uncertainty).
 *
 * @example
 * ```typescript
 * const newNode: SkillNode = {
 *   id: 'cardio-basics',
 *   loId: 'LO-CARDIO-001',
 *   status: SkillNodeStatus.LOCKED,
 *   progress: createDefaultProgress(),
 *   // ... other fields
 * };
 * ```
 */
export function createDefaultProgress(): SkillNodeProgress {
  return {
    questionsAttempted: 0,
    questionsCorrect: 0,
    currentAccuracy: 0,
    thetaHat: 0,
    standardError: 0.8,
    masteryProbability: 0,
    xpEarned: 0,
    masteryPoints: 0,
    studySessions: 0,
    totalStudyTimeMs: 0,
    streakDays: 0,
  };
}

/**
 * Initialize progress from existing IRT state
 *
 * @param irtState - IRT state from the Rasch model
 * @param itemStats - Aggregated statistics for items in this LO
 * @returns Initialized progress with IRT metrics
 *
 * @remarks
 * Use this when syncing an existing learner's IRT state to
 * the skill tree system. It maps:
 * - IRT theta/SE to progress tracking
 * - Item attempts/correct to node statistics
 * - Calculates mastery probability and points
 *
 * This is the bridge between the existing study engine and
 * the new skill tree gamification layer.
 *
 * @example
 * ```typescript
 * const irtState = learnerState.los[loId];
 * const itemStats = { attempts: 20, correct: 17 };
 * const progress = initializeProgressFromIRT(irtState, itemStats);
 *
 * // progress now has:
 * // - questionsAttempted: 20
 * // - questionsCorrect: 17
 * // - currentAccuracy: 85
 * // - thetaHat: (from IRT)
 * // - masteryPoints: 72 (Familiar)
 * ```
 */
export function initializeProgressFromIRT(
  irtState: LearnerLoState,
  itemStats: {
    attempts: number;
    correct: number;
  }
): SkillNodeProgress {
  const questionsAttempted = itemStats.attempts;
  const questionsCorrect = itemStats.correct;
  const currentAccuracy = questionsAttempted > 0
    ? (questionsCorrect / questionsAttempted) * 100
    : 0;

  const thetaHat = irtState.thetaHat;
  const standardError = irtState.se;
  const masteryProb = masteryProbability(thetaHat, standardError, 1.5);
  const masteryPoints = calculateMasteryPoints(currentAccuracy, masteryProb, questionsAttempted);

  return {
    questionsAttempted,
    questionsCorrect,
    currentAccuracy,
    thetaHat,
    standardError,
    masteryProbability: masteryProb,
    xpEarned: 0, // Would be calculated from history
    masteryPoints,
    studySessions: 0,
    totalStudyTimeMs: 0,
    streakDays: 0,
  };
}
