/**
 * Skill Tree System - Public API
 *
 * Exports all functionality for the medical education skill tree gamification system.
 */

// Core types
export type {
  SkillNode,
  SkillNodeProgress,
  SkillTree,
  SkillTreeEdge,
  SkillTreeMetadata,
  LearnerSkillTreeProgress,
  DomainProgress,
  Milestone,
  SkillTreeLayout,
  LayoutPosition,
  DomainCluster,
  LearningPathway,
  UnlockRequirements,
  SkillTreeFilter,
  SkillTreeSortKey,
  SkillTreeView,
} from '../types/skill-tree';

export {
  SkillNodeStatus,
  SkillNodeType,
  SKILL_NODE_XP_REWARDS,
  SKILL_NODE_COLORS,
} from '../types/skill-tree';

// Progression engine
export {
  determineSkillNodeStatus,
  canUnlockNode,
  updateSkillNodeProgress,
  calculateMasteryPoints,
  calculateXPReward,
  awardMilestoneXP,
  getMinLevelForNodeType,
  getRecommendedNodes,
  shouldReviewNode,
  generateUnlockRequirements,
  createDefaultProgress,
  initializeProgressFromIRT,
} from './progression';

// Integration layer
export {
  syncSkillTreeFromLearnerState,
  enrichSkillTreeWithAnalytics,
  awardNodeMilestoneXP,
  updateNodeProgress,
  getUnlockedNodes,
  getStudyableNodes,
  getReviewNodes,
  getCompletionStats,
} from './integration';

// Layout engine
export {
  generateBentoLayout,
  generateLinearPathwayLayout,
  generateBranchingTreeLayout,
  adaptLayoutForMobile,
  getVisibleNodes,
} from './layout';
