/**
 * Skill Tree Layout Engine
 *
 * Generates visual layouts for skill tree rendering:
 * - Bento grid positioning
 * - Linear pathway views
 * - Branching tree layouts
 * - Responsive viewport management
 */

import {
  SkillTree,
  SkillNode,
  SkillTreeLayout,
  LayoutPosition,
  DomainCluster,
  LearningPathway,
  SkillNodeType,
  SkillNodeStatus,
} from '../types/skill-tree';

// ============================================================================
// LAYOUT GENERATION
// ============================================================================

/**
 * Generate bento grid layout for skill tree
 */
export function generateBentoLayout(
  skillTree: SkillTree,
  options?: {
    maxColumns?: number;
    nodeBaseSize?: number;
    gapSize?: number;
  }
): SkillTreeLayout {
  const maxColumns = options?.maxColumns ?? 6;
  const nodeBaseSize = options?.nodeBaseSize ?? 120;
  const gapSize = options?.gapSize ?? 16;

  const positions: Record<string, LayoutPosition> = {};
  let currentRow = 0;
  let currentColumn = 0;
  let maxRow = 0;

  // Group nodes by domain
  const domainGroups = groupNodesByDomain(skillTree);

  // Layout each domain cluster
  for (const [domain, nodes] of domainGroups) {
    // Start new row for each domain
    if (currentColumn > 0) {
      currentRow++;
      currentColumn = 0;
    }

    // Domain header (spans full width)
    // We'll skip adding a visual header node, just track the space

    // Layout nodes in this domain
    for (const node of nodes) {
      // Determine node size based on type
      const { rows, columns } = getNodeSize(node.type);

      // Check if node fits in current row
      if (currentColumn + columns > maxColumns) {
        currentRow += rows;
        currentColumn = 0;
      }

      // Position the node
      positions[node.id] = {
        nodeId: node.id,
        row: currentRow,
        column: currentColumn,
        layer: getNodeLayer(node.type),
        span: { rows, columns },
        highlight: node.status === SkillNodeStatus.AVAILABLE,
        pulse: shouldPulseNode(node),
        connectionPoints: computeConnectionPoints(node, currentColumn, maxColumns),
      };

      // Advance column
      currentColumn += columns;

      // Track max row
      maxRow = Math.max(maxRow, currentRow + rows);
    }

    // Move to next row after domain
    currentRow = maxRow;
    currentColumn = 0;
  }

  // Generate domain clusters
  const domainClusters = generateDomainClusters(domainGroups, positions);

  // Generate learning pathways
  const pathways = generateLearningPathways(skillTree);

  return {
    treeId: skillTree.metadata.treeId,
    layoutType: 'hybrid',
    gridConfig: {
      rows: maxRow + 2, // Add padding
      columns: maxColumns,
      gapSize,
      nodeBaseSize,
    },
    positions,
    domainClusters,
    pathways,
    viewport: {
      defaultZoom: 1.0,
      focusNodeId: findFocusNode(skillTree),
      minZoom: 0.5,
      maxZoom: 2.0,
    },
  };
}

/**
 * Generate linear pathway layout (Duolingo-style)
 */
export function generateLinearPathwayLayout(
  skillTree: SkillTree,
  pathwayNodeIds?: string[],
  options?: {
    nodesPerRow?: number;
    nodeBaseSize?: number;
    gapSize?: number;
  }
): SkillTreeLayout {
  const nodesPerRow = options?.nodesPerRow ?? 3;
  const nodeBaseSize = options?.nodeBaseSize ?? 100;
  const gapSize = options?.gapSize ?? 20;

  // Use provided pathway or compute default
  const nodeIds = pathwayNodeIds ?? computeDefaultPathway(skillTree);
  const positions: Record<string, LayoutPosition> = {};

  let currentRow = 0;
  let currentColumn = 0;

  for (const nodeId of nodeIds) {
    const node = skillTree.nodes[nodeId];
    if (!node) continue;

    // Position in linear sequence
    positions[nodeId] = {
      nodeId,
      row: currentRow,
      column: currentColumn,
      layer: 1,
      span: { rows: 1, columns: 1 },
      highlight: node.status === SkillNodeStatus.AVAILABLE,
      pulse: shouldPulseNode(node),
      connectionPoints: {
        top: currentRow > 0,
        bottom: currentRow < nodeIds.length / nodesPerRow - 1,
        left: false,
        right: false,
      },
    };

    // Advance position
    currentColumn++;
    if (currentColumn >= nodesPerRow) {
      currentColumn = 0;
      currentRow++;
    }
  }

  return {
    treeId: skillTree.metadata.treeId,
    layoutType: 'linear',
    gridConfig: {
      rows: Math.ceil(nodeIds.length / nodesPerRow),
      columns: nodesPerRow,
      gapSize,
      nodeBaseSize,
    },
    positions,
    domainClusters: [],
    pathways: generateLearningPathways(skillTree),
    viewport: {
      defaultZoom: 1.0,
      minZoom: 0.7,
      maxZoom: 1.5,
    },
  };
}

/**
 * Generate branching tree layout (traditional skill tree)
 */
export function generateBranchingTreeLayout(
  skillTree: SkillTree,
  options?: {
    horizontalSpacing?: number;
    verticalSpacing?: number;
    nodeBaseSize?: number;
  }
): SkillTreeLayout {
  const nodeBaseSize = options?.nodeBaseSize ?? 100;
  const horizontalSpacing = options?.horizontalSpacing ?? 150;
  const verticalSpacing = options?.verticalSpacing ?? 120;

  const positions: Record<string, LayoutPosition> = {};

  // Start with root nodes
  const rootNodes = skillTree.rootNodeIds.map((id) => skillTree.nodes[id]);

  // Build tree levels using breadth-first traversal
  const levels: SkillNode[][] = [];
  const visited = new Set<string>();
  let currentLevel: SkillNode[] = rootNodes;

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    const nextLevel: SkillNode[] = [];

    for (const node of currentLevel) {
      visited.add(node.id);

      // Add children (nodes that list this as prerequisite)
      for (const childId of node.unlocks) {
        const child = skillTree.nodes[childId];
        if (child && !visited.has(childId) && !nextLevel.includes(child)) {
          // Check all prerequisites are in visited
          const allPrereqsVisited = child.prerequisiteIds.every((pid) => visited.has(pid));
          if (allPrereqsVisited) {
            nextLevel.push(child);
          }
        }
      }
    }

    currentLevel = nextLevel;
  }

  // Position nodes level by level
  levels.forEach((levelNodes, levelIndex) => {
    const levelWidth = levelNodes.length;

    levelNodes.forEach((node, indexInLevel) => {
      // Center nodes horizontally
      const columnOffset = Math.floor((10 - levelWidth) / 2); // Assume max 10 columns
      const column = columnOffset + indexInLevel;

      positions[node.id] = {
        nodeId: node.id,
        row: levelIndex * 2, // Vertical spacing
        column: column,
        layer: 1,
        span: { rows: 1, columns: 1 },
        highlight: node.status === SkillNodeStatus.AVAILABLE,
        pulse: shouldPulseNode(node),
        connectionPoints: {
          top: levelIndex > 0,
          bottom: levelIndex < levels.length - 1,
          left: false,
          right: false,
        },
      };
    });
  });

  return {
    treeId: skillTree.metadata.treeId,
    layoutType: 'branching',
    gridConfig: {
      rows: levels.length * 2,
      columns: 10,
      gapSize: 16,
      nodeBaseSize,
    },
    positions,
    domainClusters: generateDomainClusters(groupNodesByDomain(skillTree), positions),
    pathways: generateLearningPathways(skillTree),
    viewport: {
      defaultZoom: 0.8,
      focusNodeId: findFocusNode(skillTree),
      minZoom: 0.5,
      maxZoom: 1.5,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Group nodes by domain
 */
function groupNodesByDomain(skillTree: SkillTree): Map<string, SkillNode[]> {
  const groups = new Map<string, SkillNode[]>();

  for (const node of Object.values(skillTree.nodes)) {
    const existing = groups.get(node.domain) ?? [];
    existing.push(node);
    groups.set(node.domain, existing);
  }

  // Sort nodes within each domain by prerequisites (topological sort)
  for (const [domain, nodes] of groups) {
    groups.set(domain, topologicalSort(nodes));
  }

  return groups;
}

/**
 * Topological sort for nodes (prerequisites before dependents)
 */
function topologicalSort(nodes: SkillNode[]): SkillNode[] {
  const sorted: SkillNode[] = [];
  const visited = new Set<string>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  function visit(node: SkillNode) {
    if (visited.has(node.id)) return;
    visited.add(node.id);

    // Visit prerequisites first
    for (const prereqId of node.prerequisiteIds) {
      const prereq = nodeMap.get(prereqId);
      if (prereq) visit(prereq);
    }

    sorted.push(node);
  }

  // Visit nodes with no prerequisites first
  const rootNodes = nodes.filter((n) => n.prerequisiteIds.length === 0);
  for (const root of rootNodes) {
    visit(root);
  }

  // Visit remaining nodes
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visit(node);
    }
  }

  return sorted;
}

/**
 * Get node size based on type
 */
function getNodeSize(type: SkillNodeType): { rows: number; columns: number } {
  switch (type) {
    case SkillNodeType.FOUNDATION:
      return { rows: 1, columns: 1 };
    case SkillNodeType.CORE:
      return { rows: 1, columns: 1 };
    case SkillNodeType.ADVANCED:
      return { rows: 1, columns: 2 }; // Wider for emphasis
    case SkillNodeType.EXPERT:
      return { rows: 2, columns: 2 }; // Larger for importance
    case SkillNodeType.CAPSTONE:
      return { rows: 2, columns: 3 }; // Largest, spans multiple columns
    default:
      return { rows: 1, columns: 1 };
  }
}

/**
 * Get z-index layer for node type
 */
function getNodeLayer(type: SkillNodeType): number {
  switch (type) {
    case SkillNodeType.FOUNDATION:
      return 1;
    case SkillNodeType.CORE:
      return 2;
    case SkillNodeType.ADVANCED:
      return 3;
    case SkillNodeType.EXPERT:
      return 4;
    case SkillNodeType.CAPSTONE:
      return 5;
    default:
      return 1;
  }
}

/**
 * Determine if node should pulse (urgent to study)
 */
function shouldPulseNode(node: SkillNode): boolean {
  // Pulse available nodes that are high-yield
  if (node.status === SkillNodeStatus.AVAILABLE && node.highYield) {
    return true;
  }

  // Pulse nodes due for review
  if (node.status === SkillNodeStatus.MASTERED && node.progress.nextReviewDue) {
    const reviewDue = new Date(node.progress.nextReviewDue);
    const now = new Date();
    if (now >= reviewDue) {
      return true;
    }
  }

  return false;
}

/**
 * Compute connection points for edges
 */
function computeConnectionPoints(
  node: SkillNode,
  currentColumn: number,
  maxColumns: number
): LayoutPosition['connectionPoints'] {
  return {
    top: node.prerequisiteIds.length > 0,
    bottom: node.unlocks.length > 0,
    left: currentColumn > 0,
    right: currentColumn < maxColumns - 1,
  };
}

/**
 * Generate domain clusters for visual grouping
 */
function generateDomainClusters(
  domainGroups: Map<string, SkillNode[]>,
  positions: Record<string, LayoutPosition>
): DomainCluster[] {
  const clusters: DomainCluster[] = [];

  for (const [domain, nodes] of domainGroups) {
    const nodeIds = nodes.map((n) => n.id);

    // Compute center position
    const nodePositions = nodeIds
      .map((id) => positions[id])
      .filter(Boolean);

    if (nodePositions.length === 0) continue;

    const avgRow = nodePositions.reduce((sum, p) => sum + p.row, 0) / nodePositions.length;
    const avgColumn = nodePositions.reduce((sum, p) => sum + p.column, 0) / nodePositions.length;

    clusters.push({
      domain,
      nodeIds,
      centerPosition: {
        row: Math.floor(avgRow),
        column: Math.floor(avgColumn),
      },
      color: getDomainColor(domain),
      icon: getDomainIcon(domain),
    });
  }

  return clusters;
}

/**
 * Generate curated learning pathways
 */
function generateLearningPathways(skillTree: SkillTree): LearningPathway[] {
  const pathways: LearningPathway[] = [];

  // Pathway 1: Foundation path (all foundation nodes)
  const foundationNodes = Object.values(skillTree.nodes).filter(
    (n) => n.type === SkillNodeType.FOUNDATION
  );
  if (foundationNodes.length > 0) {
    pathways.push({
      id: 'foundation',
      name: 'Foundation Path',
      description: 'Master the basics before advancing',
      nodeIds: topologicalSort(foundationNodes).map((n) => n.id),
      difficulty: 'beginner',
      estimatedHours: foundationNodes.reduce((sum, n) => sum + n.estimatedMinutes, 0) / 60,
      highYield: false,
    });
  }

  // Pathway 2: High-yield path (all high-yield nodes)
  const highYieldNodes = Object.values(skillTree.nodes).filter((n) => n.highYield);
  if (highYieldNodes.length > 0) {
    pathways.push({
      id: 'high-yield',
      name: 'High-Yield Path',
      description: 'Focus on board-exam critical topics',
      nodeIds: topologicalSort(highYieldNodes).map((n) => n.id),
      difficulty: 'advanced',
      estimatedHours: highYieldNodes.reduce((sum, n) => sum + n.estimatedMinutes, 0) / 60,
      highYield: true,
    });
  }

  // Pathway 3: Domain-specific paths
  const domainGroups = groupNodesByDomain(skillTree);
  for (const [domain, nodes] of domainGroups) {
    if (nodes.length >= 3) {
      pathways.push({
        id: `domain-${domain.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${domain} Mastery`,
        description: `Complete ${domain} curriculum`,
        nodeIds: nodes.map((n) => n.id),
        difficulty: 'intermediate',
        estimatedHours: nodes.reduce((sum, n) => sum + n.estimatedMinutes, 0) / 60,
        highYield: nodes.some((n) => n.highYield),
      });
    }
  }

  return pathways;
}

/**
 * Compute default pathway (recommended order)
 */
function computeDefaultPathway(skillTree: SkillTree): string[] {
  const allNodes = Object.values(skillTree.nodes);
  const sorted = topologicalSort(allNodes);

  // Prioritize foundation → core → advanced → expert → capstone
  const typeOrder = {
    [SkillNodeType.FOUNDATION]: 0,
    [SkillNodeType.CORE]: 1,
    [SkillNodeType.ADVANCED]: 2,
    [SkillNodeType.EXPERT]: 3,
    [SkillNodeType.CAPSTONE]: 4,
  };

  sorted.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return sorted.map((n) => n.id);
}

/**
 * Find node to focus on (for viewport centering)
 */
function findFocusNode(skillTree: SkillTree): string | undefined {
  // Focus on first available node, or first in-progress node
  const inProgress = Object.values(skillTree.nodes).find(
    (n) => n.status === SkillNodeStatus.ATTEMPTED ||
           n.status === SkillNodeStatus.FAMILIAR ||
           n.status === SkillNodeStatus.PROFICIENT
  );

  if (inProgress) return inProgress.id;

  const available = Object.values(skillTree.nodes).find(
    (n) => n.status === SkillNodeStatus.AVAILABLE
  );

  return available?.id;
}

/**
 * Get theme color for domain
 */
function getDomainColor(domain: string): string {
  const colorMap: Record<string, string> = {
    Cardiology: '#EF4444', // red-500
    Pulmonology: '#3B82F6', // blue-500
    Gastroenterology: '#10B981', // green-500
    Neurology: '#8B5CF6', // violet-500
    Endocrinology: '#F59E0B', // amber-500
    Nephrology: '#06B6D4', // cyan-500
    Hematology: '#EC4899', // pink-500
    Immunology: '#14B8A6', // teal-500
    Pharmacology: '#A855F7', // purple-500
    Pathology: '#F97316', // orange-500
  };

  return colorMap[domain] ?? '#6B7280'; // gray-500 default
}

/**
 * Get icon for domain
 */
function getDomainIcon(domain: string): string {
  const iconMap: Record<string, string> = {
    Cardiology: '❤️',
    Pulmonology: '🫁',
    Gastroenterology: '🫃',
    Neurology: '🧠',
    Endocrinology: '🧬',
    Nephrology: '💧',
    Hematology: '🩸',
    Immunology: '🛡️',
    Pharmacology: '💊',
    Pathology: '🔬',
  };

  return iconMap[domain] ?? '📚';
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

/**
 * Adjust layout for mobile viewport
 */
export function adaptLayoutForMobile(layout: SkillTreeLayout): SkillTreeLayout {
  return {
    ...layout,
    gridConfig: {
      ...layout.gridConfig,
      columns: 2, // Narrow to 2 columns for mobile
      nodeBaseSize: 80, // Smaller nodes
      gapSize: 12, // Tighter spacing
    },
    viewport: {
      ...layout.viewport,
      defaultZoom: 0.9,
      minZoom: 0.6,
    },
  };
}

/**
 * Get visible nodes within viewport bounds
 */
export function getVisibleNodes(
  layout: SkillTreeLayout,
  viewport: {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
  }
): string[] {
  const visibleNodeIds: string[] = [];

  for (const [nodeId, position] of Object.entries(layout.positions)) {
    const { row, column, span } = position;

    // Check if node overlaps viewport
    const nodeEndRow = row + span.rows;
    const nodeEndColumn = column + span.columns;

    const overlapsRows = row < viewport.endRow && nodeEndRow > viewport.startRow;
    const overlapsColumns = column < viewport.endColumn && nodeEndColumn > viewport.startColumn;

    if (overlapsRows && overlapsColumns) {
      visibleNodeIds.push(nodeId);
    }
  }

  return visibleNodeIds;
}
