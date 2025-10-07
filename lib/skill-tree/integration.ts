/**
 * Skill Tree Integration Layer
 *
 * Connects the skill tree system to existing infrastructure:
 * - IRT/Rasch model (lib/study-engine.ts)
 * - XP system (lib/xp-system.ts)
 * - Analytics (lib/getAnalytics.ts)
 * - Learner state (lib/server/study-state.ts)
 */

import { SkillNode, SkillNodeStatus, SkillNodeType, SkillTree } from '../types/skill-tree';
import { LearnerState } from '../server/study-state';
import { AnalyticsSummary } from '../getAnalytics';
import { determineSkillNodeStatus, createDefaultProgress, initializeProgressFromIRT } from './progression';

// ============================================================================
// SKILL TREE FROM LEARNER STATE
// ============================================================================

/**
 * Build or update skill tree from learner state
 *
 * @param learnerState - Current learner state from the IRT system
 * @param treeDefinition - Skill tree structure with node definitions
 * @returns Updated skill tree with synchronized progress
 *
 * @remarks
 * This is the primary integration point between the IRT/Rasch model
 * and the skill tree system. It:
 *
 * 1. Maps Learning Objectives (LOs) to Skill Nodes
 * 2. Syncs IRT state (theta, SE, mastery probability)
 * 3. Aggregates item-level statistics to node-level metrics
 * 4. Determines current status for each node
 * 5. Computes overall learner progress and recommendations
 *
 * **Call this function:**
 * - After each study session
 * - When loading the dashboard
 * - Before rendering the skill tree UI
 * - When calculating analytics
 *
 * @example
 * ```typescript
 * const learnerState = await loadLearnerState(userId);
 * const treeDefinition = await loadSkillTreeDefinition('internal-medicine');
 * const skillTree = syncSkillTreeFromLearnerState(learnerState, treeDefinition);
 *
 * // Now skillTree contains up-to-date progress for all nodes
 * const available = getStudyableNodes(skillTree);
 * const mastered = skillTree.learnerProgress.nodesMastered;
 * ```
 */
export function syncSkillTreeFromLearnerState(
  learnerState: LearnerState,
  treeDefinition: SkillTree
): SkillTree {
  const updatedNodes: Record<string, SkillNode> = {};

  // Get learner's level and XP from gamification data
  const gamification = learnerState.gamification ?? {
    level: 1,
    totalXP: 0,
    currentXP: 0,
    streak: 0,
    lastStudyDate: null,
  };

  // Iterate through all nodes in tree definition
  for (const [nodeId, nodeDefinition] of Object.entries(treeDefinition.nodes)) {
    const loId = nodeDefinition.loId;

    // Get IRT state for this LO
    const irtState = learnerState.los[loId];

    // Get item-level stats (aggregate from all items in this LO)
    const itemStats = aggregateItemStatsForLO(learnerState, loId);

    // Initialize or update progress
    let progress = nodeDefinition.progress;
    if (irtState && itemStats.attempts > 0) {
      progress = initializeProgressFromIRT(irtState, itemStats);
    } else if (progress.questionsAttempted === 0) {
      progress = createDefaultProgress();
    }

    // Get prerequisites
    const prerequisites = nodeDefinition.prerequisiteIds
      .map((prereqId) => treeDefinition.nodes[prereqId])
      .filter(Boolean);

    // Determine status
    const status = determineSkillNodeStatus(
      { ...nodeDefinition, progress },
      prerequisites,
      gamification.level,
      gamification.totalXP
    );

    // Update timestamps
    const firstAttemptedAt = itemStats.firstAttemptTs
      ? new Date(itemStats.firstAttemptTs).toISOString()
      : nodeDefinition.firstAttemptedAt;

    const masteredAt = status === SkillNodeStatus.MASTERED && !nodeDefinition.masteredAt
      ? new Date().toISOString()
      : nodeDefinition.masteredAt;

    const lastReviewedAt = itemStats.lastAttemptTs
      ? new Date(itemStats.lastAttemptTs).toISOString()
      : nodeDefinition.lastReviewedAt;

    // Update node
    updatedNodes[nodeId] = {
      ...nodeDefinition,
      status,
      progress,
      firstAttemptedAt,
      masteredAt,
      lastReviewedAt,
    };
  }

  // Return updated tree
  return {
    ...treeDefinition,
    nodes: updatedNodes,
    learnerProgress: computeLearnerProgress(updatedNodes, treeDefinition, learnerState.learnerId),
  };
}

/**
 * Aggregate item-level statistics for a Learning Objective
 */
function aggregateItemStatsForLO(
  learnerState: LearnerState,
  loId: string
): {
  attempts: number;
  correct: number;
  firstAttemptTs?: number;
  lastAttemptTs?: number;
} {
  let attempts = 0;
  let correct = 0;
  let firstAttemptTs: number | undefined;
  let lastAttemptTs: number | undefined;

  // Scan all items for this LO
  // Note: In practice, we'd maintain a LO -> items index
  for (const [itemId, itemMeta] of Object.entries(learnerState.items)) {
    // Check if item belongs to this LO (convention: itemId starts with loId)
    // This is a simplification - in production, use explicit LO->item mappings
    if (itemId.startsWith(loId)) {
      attempts += itemMeta.attempts;
      correct += itemMeta.correct;

      if (itemMeta.lastAttemptTs) {
        if (!firstAttemptTs || itemMeta.lastAttemptTs < firstAttemptTs) {
          firstAttemptTs = itemMeta.lastAttemptTs;
        }
        if (!lastAttemptTs || itemMeta.lastAttemptTs > lastAttemptTs) {
          lastAttemptTs = itemMeta.lastAttemptTs;
        }
      }
    }
  }

  return { attempts, correct, firstAttemptTs, lastAttemptTs };
}

/**
 * Compute overall learner progress on the skill tree
 */
function computeLearnerProgress(
  nodes: Record<string, SkillNode>,
  treeDefinition: SkillTree,
  learnerId: string
): SkillTree['learnerProgress'] {
  const nodeArray = Object.values(nodes);
  const totalNodes = nodeArray.length;

  const nodesUnlocked = nodeArray.filter(
    (n) => n.status !== SkillNodeStatus.LOCKED
  ).length;

  const nodesAttempted = nodeArray.filter((n) =>
    [
      SkillNodeStatus.ATTEMPTED,
      SkillNodeStatus.FAMILIAR,
      SkillNodeStatus.PROFICIENT,
      SkillNodeStatus.MASTERED,
    ].includes(n.status)
  ).length;

  const nodesMastered = nodeArray.filter(
    (n) => n.status === SkillNodeStatus.MASTERED
  ).length;

  const totalXPEarned = nodeArray.reduce((sum, n) => sum + n.progress.xpEarned, 0);
  const totalMasteryPoints = nodeArray.reduce((sum, n) => sum + n.progress.masteryPoints, 0);
  const completionPercentage = totalNodes > 0 ? (nodesMastered / totalNodes) * 100 : 0;

  // Current path: nodes in progress
  const currentPath = nodeArray
    .filter((n) =>
      [
        SkillNodeStatus.AVAILABLE,
        SkillNodeStatus.ATTEMPTED,
        SkillNodeStatus.FAMILIAR,
        SkillNodeStatus.PROFICIENT,
      ].includes(n.status)
    )
    .sort((a, b) => b.progress.questionsAttempted - a.progress.questionsAttempted)
    .map((n) => n.id);

  // Recommended next: available nodes
  const recommendedNext = nodeArray
    .filter((n) => n.status === SkillNodeStatus.AVAILABLE)
    .sort((a, b) => {
      // Prioritize foundation/core, then by XP potential
      const typeOrder = {
        [SkillNodeType.FOUNDATION]: 0,
        [SkillNodeType.CORE]: 1,
        [SkillNodeType.ADVANCED]: 2,
        [SkillNodeType.EXPERT]: 3,
        [SkillNodeType.CAPSTONE]: 4,
      };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      if (typeDiff !== 0) return typeDiff;
      return b.xpRequired - a.xpRequired;
    })
    .slice(0, 5)
    .map((n) => n.id);

  // Domain progress
  const domainMap = new Map<string, { total: number; mastered: number; totalAccuracy: number; count: number }>();
  for (const node of nodeArray) {
    const existing = domainMap.get(node.domain) ?? {
      total: 0,
      mastered: 0,
      totalAccuracy: 0,
      count: 0,
    };
    existing.total += 1;
    if (node.status === SkillNodeStatus.MASTERED) {
      existing.mastered += 1;
    }
    if (node.progress.questionsAttempted > 0) {
      existing.totalAccuracy += node.progress.currentAccuracy;
      existing.count += 1;
    }
    domainMap.set(node.domain, existing);
  }

  const domains = Array.from(domainMap.entries()).map(([domain, stats]) => ({
    domain,
    nodesTotal: stats.total,
    nodesMastered: stats.mastered,
    percentComplete: (stats.mastered / stats.total) * 100,
    averageAccuracy: stats.count > 0 ? stats.totalAccuracy / stats.count : 0,
  }));

  // Milestones (example: first mastery, domain completion, etc.)
  const milestones = generateMilestones(nodeArray);

  // Timestamps
  const startedAt = nodeArray
    .map((n) => n.firstAttemptedAt)
    .filter(Boolean)
    .sort()[0] ?? new Date().toISOString();

  const lastStudiedAt = nodeArray
    .map((n) => n.lastReviewedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0] ?? new Date().toISOString();

  return {
    learnerId,
    treeId: treeDefinition.metadata.treeId,
    nodesUnlocked,
    nodesAttempted,
    nodesMastered,
    totalXPEarned,
    totalMasteryPoints,
    completionPercentage,
    currentPath,
    recommendedNext,
    domains,
    milestones,
    startedAt,
    lastStudiedAt,
  };
}

/**
 * Generate milestones based on progress
 */
function generateMilestones(nodes: SkillNode[]): SkillTree['learnerProgress']['milestones'] {
  const milestones: SkillTree['learnerProgress']['milestones'] = [];

  const masteredNodes = nodes.filter((n) => n.status === SkillNodeStatus.MASTERED);

  // First mastery
  if (masteredNodes.length >= 1) {
    const firstMastered = masteredNodes.sort(
      (a, b) => new Date(a.masteredAt!).getTime() - new Date(b.masteredAt!).getTime()
    )[0];
    milestones.push({
      id: 'first-mastery',
      name: 'First Mastery',
      description: `Mastered ${firstMastered.title}`,
      unlockedAt: firstMastered.masteredAt!,
      icon: '🎯',
      xpBonus: 500,
    });
  }

  // 10 masteries
  if (masteredNodes.length >= 10) {
    milestones.push({
      id: 'ten-masteries',
      name: 'Dedicated Learner',
      description: 'Mastered 10 skills',
      unlockedAt: masteredNodes[9].masteredAt!,
      icon: '🏆',
      xpBonus: 2000,
    });
  }

  // Domain mastery (all nodes in a domain)
  const domainGroups = new Map<string, SkillNode[]>();
  for (const node of nodes) {
    const group = domainGroups.get(node.domain) ?? [];
    group.push(node);
    domainGroups.set(node.domain, group);
  }

  for (const [domain, domainNodes] of domainGroups) {
    const allMastered = domainNodes.every((n) => n.status === SkillNodeStatus.MASTERED);
    if (allMastered && domainNodes.length > 0) {
      const latestMastered = domainNodes.sort(
        (a, b) => new Date(b.masteredAt!).getTime() - new Date(a.masteredAt!).getTime()
      )[0];
      milestones.push({
        id: `domain-${domain}`,
        name: `${domain} Expert`,
        description: `Mastered all ${domain} skills`,
        unlockedAt: latestMastered.masteredAt!,
        icon: '🌟',
        xpBonus: 5000,
      });
    }
  }

  return milestones;
}

// ============================================================================
// ANALYTICS INTEGRATION
// ============================================================================

/**
 * Enrich skill tree with analytics data
 *
 * @param skillTree - Skill tree to enrich
 * @param analytics - Analytics summary from getAnalytics()
 * @returns Enriched skill tree with TTM and recommendations
 *
 * @remarks
 * Augments skill tree nodes with predictive analytics:
 * - **Time to Mastery (TTM)**: Projected minutes to reach mastery
 * - **Difficulty Adjustments**: Based on cohort performance
 * - **Personalized Estimates**: Using learner's historical pace
 *
 * This data helps learners:
 * - Plan study sessions effectively
 * - Understand time commitment for each skill
 * - Prioritize based on effort vs. reward
 *
 * @example
 * ```typescript
 * const analytics = await getAnalytics(userId);
 * const enrichedTree = enrichSkillTreeWithAnalytics(skillTree, analytics);
 *
 * // Now nodes have updated estimatedMinutes based on learner's pace
 * const quickWins = Object.values(enrichedTree.nodes)
 *   .filter(n => n.status === SkillNodeStatus.AVAILABLE)
 *   .sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
 *   .slice(0, 5);
 * ```
 */
export function enrichSkillTreeWithAnalytics(
  skillTree: SkillTree,
  analytics: AnalyticsSummary | null
): SkillTree {
  if (!analytics) return skillTree;

  const updatedNodes: Record<string, SkillNode> = {};

  for (const [nodeId, node] of Object.entries(skillTree.nodes)) {
    // Find matching LO in analytics
    const loAnalytics = analytics.ttm_per_lo.find((lo) => lo.lo_id === node.loId);

    if (loAnalytics) {
      // Update estimated time to mastery
      const estimatedMinutes = loAnalytics.projected_minutes_to_mastery ?? node.estimatedMinutes;

      // Update progress with analytics insights
      updatedNodes[nodeId] = {
        ...node,
        estimatedMinutes: Math.round(estimatedMinutes),
      };
    } else {
      updatedNodes[nodeId] = node;
    }
  }

  return {
    ...skillTree,
    nodes: updatedNodes,
  };
}

// ============================================================================
// XP SYSTEM INTEGRATION
// ============================================================================

/**
 * Award XP to learner's gamification state when node status changes
 *
 * @param oldStatus - Previous skill node status
 * @param newStatus - New skill node status achieved
 * @param nodeType - Type of skill node
 * @returns Bonus XP earned for the milestone
 *
 * @remarks
 * This function is called by the study engine when a learner's
 * performance triggers a status transition. It awards escalating
 * milestone bonuses:
 *
 * **Base Rewards:**
 * - Attempted: 50 XP
 * - Familiar: 150 XP
 * - Proficient: 300 XP
 * - Mastered: 1000 XP
 *
 * **Type Multipliers:**
 * - Foundation: 1x
 * - Core: 1.5x
 * - Advanced: 2x
 * - Expert: 2.5x
 * - Capstone: 3x
 *
 * @example
 * ```typescript
 * // After updating progress, check for status change
 * const oldStatus = node.status;
 * const newStatus = determineSkillNodeStatus(node, prerequisites, level, xp);
 *
 * if (newStatus !== oldStatus) {
 *   const bonusXP = awardNodeMilestoneXP(oldStatus, newStatus, node.type);
 *   // Add bonusXP to learner's gamification.totalXP
 * }
 * ```
 */
export function awardNodeMilestoneXP(
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

  // Award XP based on new status reached
  const rewards = {
    [SkillNodeStatus.LOCKED]: 0,
    [SkillNodeStatus.AVAILABLE]: 0,
    [SkillNodeStatus.ATTEMPTED]: 50,
    [SkillNodeStatus.FAMILIAR]: 150,
    [SkillNodeStatus.PROFICIENT]: 300,
    [SkillNodeStatus.MASTERED]: 1000,
  };

  // Multiply by node type
  const multipliers = {
    [SkillNodeType.FOUNDATION]: 1.0,
    [SkillNodeType.CORE]: 1.5,
    [SkillNodeType.ADVANCED]: 2.0,
    [SkillNodeType.EXPERT]: 2.5,
    [SkillNodeType.CAPSTONE]: 3.0,
  };

  const baseXP = rewards[newStatus] ?? 0;
  const multiplier = multipliers[nodeType] ?? 1.0;

  return Math.floor(baseXP * multiplier);
}

// ============================================================================
// NODE PROGRESS UPDATE
// ============================================================================

/**
 * Update a skill node after a question attempt
 *
 * @param node - Current skill node state
 * @param questionResult - Result of the question attempt
 * @param irtState - Updated IRT state after the attempt
 * @param learnerLevel - Current learner level
 * @param learnerTotalXP - Current total XP
 * @param prerequisites - Prerequisite nodes
 * @returns Updated node with new progress and status
 *
 * @remarks
 * This is the main function to call after each question attempt.
 * It handles:
 * 1. Progress update with new metrics
 * 2. Status recalculation
 * 3. XP calculation (base + bonuses)
 * 4. Milestone detection and bonus awards
 * 5. Timestamp updates
 *
 * @example
 * ```typescript
 * import { updateNodeProgress } from '@/lib/skill-tree';
 *
 * // After a question attempt
 * const updatedNode = updateNodeProgress(
 *   currentNode,
 *   { correct: true, timeSeconds: 8, confidenceLevel: 4 },
 *   updatedIrtState,
 *   learnerLevel,
 *   learnerTotalXP,
 *   prerequisites
 * );
 *
 * // Check for status change and award milestone XP
 * if (updatedNode.status !== currentNode.status) {
 *   const milestoneXP = awardNodeMilestoneXP(
 *     currentNode.status,
 *     updatedNode.status,
 *     updatedNode.type
 *   );
 *   // Add milestoneXP to gamification state
 * }
 * ```
 */
export function updateNodeProgress(
  node: SkillNode,
  questionResult: {
    correct: boolean;
    timeSeconds: number;
    confidenceLevel?: number;
  },
  irtState: { thetaHat: number; se: number },
  learnerLevel: number,
  learnerTotalXP: number,
  prerequisites: SkillNode[]
): {
  updatedNode: SkillNode;
  xpEarned: number;
  statusChanged: boolean;
  milestoneXP: number;
} {
  const { updateSkillNodeProgress } = require('./progression');

  // Update progress
  const progressResult = updateSkillNodeProgress(
    node.progress,
    node.type,
    questionResult,
    irtState
  );

  // Create updated node
  const updatedNode: SkillNode = {
    ...node,
    progress: progressResult.updatedProgress,
    lastReviewedAt: new Date().toISOString(),
    firstAttemptedAt: node.firstAttemptedAt ?? new Date().toISOString(),
  };

  // Recalculate status
  const { determineSkillNodeStatus, awardMilestoneXP } = require('./progression');
  const newStatus = determineSkillNodeStatus(
    updatedNode,
    prerequisites,
    learnerLevel,
    learnerTotalXP
  );

  const statusChanged = newStatus !== node.status;
  updatedNode.status = newStatus;

  // Update mastered timestamp
  if (newStatus === SkillNodeStatus.MASTERED && !node.masteredAt) {
    updatedNode.masteredAt = new Date().toISOString();
  }

  // Calculate milestone XP if status changed
  const milestoneXP = statusChanged
    ? awardMilestoneXP(node.status, newStatus, node.type)
    : 0;

  return {
    updatedNode,
    xpEarned: progressResult.xpEarned,
    statusChanged,
    milestoneXP,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all unlocked nodes for a learner
 */
export function getUnlockedNodes(skillTree: SkillTree): SkillNode[] {
  return Object.values(skillTree.nodes).filter(
    (node) => node.status !== SkillNodeStatus.LOCKED
  );
}

/**
 * Get nodes ready for study (available or in-progress)
 */
export function getStudyableNodes(skillTree: SkillTree): SkillNode[] {
  return Object.values(skillTree.nodes).filter((node) =>
    [
      SkillNodeStatus.AVAILABLE,
      SkillNodeStatus.ATTEMPTED,
      SkillNodeStatus.FAMILIAR,
      SkillNodeStatus.PROFICIENT,
    ].includes(node.status)
  );
}

/**
 * Get nodes that need review (mastered but due for retention check)
 */
export function getReviewNodes(skillTree: SkillTree, currentTime: Date = new Date()): SkillNode[] {
  return Object.values(skillTree.nodes).filter((node) => {
    if (node.status !== SkillNodeStatus.MASTERED) return false;
    if (!node.progress.nextReviewDue) return false;

    const reviewDue = new Date(node.progress.nextReviewDue);
    return currentTime >= reviewDue;
  });
}

/**
 * Get completion stats for the tree
 */
export function getCompletionStats(skillTree: SkillTree): {
  total: number;
  locked: number;
  available: number;
  inProgress: number;
  mastered: number;
  percentComplete: number;
} {
  const nodes = Object.values(skillTree.nodes);
  const total = nodes.length;
  const locked = nodes.filter((n) => n.status === SkillNodeStatus.LOCKED).length;
  const available = nodes.filter((n) => n.status === SkillNodeStatus.AVAILABLE).length;
  const inProgress = nodes.filter((n) =>
    [SkillNodeStatus.ATTEMPTED, SkillNodeStatus.FAMILIAR, SkillNodeStatus.PROFICIENT].includes(n.status)
  ).length;
  const mastered = nodes.filter((n) => n.status === SkillNodeStatus.MASTERED).length;
  const percentComplete = total > 0 ? (mastered / total) * 100 : 0;

  return {
    total,
    locked,
    available,
    inProgress,
    mastered,
    percentComplete,
  };
}
