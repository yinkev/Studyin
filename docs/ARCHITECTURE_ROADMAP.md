# Studyin MAX GRAPHICS - Complete Architecture Roadmap

**Version**: 1.0.0
**Date**: 2025-10-06
**Scope**: Easy → Medium → Hard (No Multiplayer)

---

## Table of Contents

1. [🟢 Easy Tier (1-2 hours each)](#-easy-tier-1-2-hours-each)
2. [🟡 Medium Tier (3-6 hours each)](#-medium-tier-3-6-hours-each)
3. [🔴 Hard Tier (1-2 days each)](#-hard-tier-1-2-days-each)
4. [Implementation Order](#implementation-order)
5. [File Structure](#file-structure)
6. [Data Models](#data-models)
7. [State Management Strategy](#state-management-strategy)

---

## 🟢 Easy Tier (1-2 hours each)

### E1. Connect XP to Question Answers

**Goal**: Award XP when users answer questions correctly

**Files to Modify**:
- `components/InteractiveLessonViewer.tsx` or
- `components/QuestionCard.tsx` (wherever questions are rendered)

**Implementation**:
```typescript
// In question handling component
import { useXP } from '../XPProvider';
import { XP_REWARDS } from '../../lib/xp-system';

const { awardXPWithFeedback } = useXP();

const handleAnswerSubmit = (isCorrect: boolean, timeTaken: number) => {
  if (!isCorrect) return;

  // Fast answer bonus
  const isFast = timeTaken < 5000;
  const xp = isFast
    ? XP_REWARDS.QUESTION_CORRECT_FAST
    : XP_REWARDS.QUESTION_CORRECT;
  const reason = isFast ? 'Fast & Correct! ⚡' : 'Correct! ✓';

  awardXPWithFeedback(xp, reason);
};
```

**Testing**:
1. Answer a question correctly
2. Verify XP toast appears
3. Check XP updates in header
4. Level up when threshold reached

**Estimated Time**: 1-2 hours

---

### E2. Connect XP to Lesson Completion

**Goal**: Award XP when users complete lessons

**Files to Modify**:
- `components/InteractiveLessonViewer.tsx`

**Implementation**:
```typescript
const handleLessonComplete = (accuracy: number, questionsCorrect: number, totalQuestions: number) => {
  const isPerfect = accuracy >= 1.0;
  const xp = isPerfect
    ? XP_REWARDS.LESSON_PERFECT
    : XP_REWARDS.LESSON_COMPLETE;
  const reason = isPerfect
    ? '🎯 Perfect Lesson!'
    : '📚 Lesson Complete!';

  awardXPWithFeedback(xp, reason);

  // Additional bonus for high accuracy
  if (accuracy >= 0.9 && !isPerfect) {
    awardXPWithFeedback(50, '⭐ Excellence Bonus!');
  }
};
```

**Estimated Time**: 1 hour

---

### E3. Update Landing Page with Real Stats

**Goal**: Show dynamic user stats on homepage

**Files to Modify**:
- `components/landing/HeroSection.tsx`

**Implementation**:
```typescript
import { useXP } from '../XPProvider';

export function HeroSection() {
  const { progress, levelInfo } = useXP();

  return (
    <section>
      {/* Dynamic Stats */}
      <div className="stats-grid">
        <StatCard
          icon="🎮"
          label="Your Level"
          value={levelInfo.level}
          subtitle={levelInfo.title}
        />
        <StatCard
          icon="⚡"
          label="Total XP"
          value={progress.totalXP.toLocaleString()}
          subtitle={`${levelInfo.percentComplete}% to next level`}
        />
        <StatCard
          icon="🔥"
          label="Streak"
          value={`${progress.streak} days`}
          subtitle="Keep it going!"
        />
      </div>
    </section>
  );
}
```

**Estimated Time**: 1 hour

---

### E4. Daily Streak Tracker

**Goal**: Track consecutive study days

**Files to Create**:
- `lib/hooks/useDailyStreak.tsx`

**Implementation**:
```typescript
// lib/hooks/useDailyStreak.tsx
import { useEffect } from 'react';
import { useXP } from '../../components/XPProvider';
import { XP_REWARDS } from '../xp-system';

export function useDailyStreak() {
  const { progress, updateStreakDaily, awardXPWithFeedback } = useXP();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastStudy = progress.lastStudyDate;

    // First study of the day
    if (lastStudy !== today) {
      updateStreakDaily();

      // Week streak bonus
      const newStreak = progress.streak + 1;
      if (newStreak % 7 === 0) {
        awardXPWithFeedback(XP_REWARDS.STREAK_WEEK, '🔥 Week Streak!');
      }
    }
  }, []);
}
```

**Usage**:
```typescript
// In any study page
import { useDailyStreak } from '../../lib/hooks/useDailyStreak';

function StudyPage() {
  useDailyStreak(); // Tracks daily streak automatically
  return <div>...</div>;
}
```

**Estimated Time**: 1 hour

---

### E5. Sound Effects

**Goal**: Add audio feedback for XP/level up

**Files to Create**:
- `public/sounds/xp-gain.mp3`
- `public/sounds/level-up.mp3`
- `lib/audio.ts`

**Implementation**:
```typescript
// lib/audio.ts
export class AudioManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds({
      'xp-gain': '/sounds/xp-gain.mp3',
      'level-up': '/sounds/level-up.mp3',
      'achievement': '/sounds/achievement.mp3',
    });
  }

  private loadSounds(soundMap: Record<string, string>) {
    Object.entries(soundMap).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = 0.5;
      this.sounds.set(name, audio);
    });
  }

  play(soundName: string) {
    if (!this.enabled) return;
    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {}); // Ignore autoplay errors
    }
  }

  toggle() {
    this.enabled = !this.enabled;
  }
}

export const audioManager = new AudioManager();
```

**Integration**:
```typescript
// In XPProvider.tsx
import { audioManager } from '../lib/audio';

const awardXPWithFeedback = useCallback((amount: number, reason?: string) => {
  const result = xpSystem.awardXP(amount, reason);

  // Play sounds
  audioManager.play('xp-gain');
  if (result.leveledUp) {
    audioManager.play('level-up');
  }

  // ... rest of code
}, [xpSystem]);
```

**Estimated Time**: 2 hours

---

### E6. Topic Progress Tracking

**Goal**: Track progress per topic/module

**Files to Create**:
- `lib/progress-tracker.ts`

**Implementation**:
```typescript
// lib/progress-tracker.ts
export interface TopicProgress {
  topicId: string;
  topicName: string;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  lastStudied: string;
  mastered: boolean; // accuracy >= 90%
}

export class ProgressTracker {
  private static STORAGE_KEY = 'studyin-topic-progress';

  static getProgress(topicId: string): TopicProgress | null {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return null;

    const progress: Record<string, TopicProgress> = JSON.parse(data);
    return progress[topicId] || null;
  }

  static updateProgress(
    topicId: string,
    topicName: string,
    wasCorrect: boolean
  ): TopicProgress {
    const current = this.getProgress(topicId) || {
      topicId,
      topicName,
      questionsAttempted: 0,
      questionsCorrect: 0,
      accuracy: 0,
      lastStudied: '',
      mastered: false,
    };

    current.questionsAttempted++;
    if (wasCorrect) current.questionsCorrect++;
    current.accuracy = current.questionsCorrect / current.questionsAttempted;
    current.lastStudied = new Date().toISOString();
    current.mastered = current.accuracy >= 0.9 && current.questionsAttempted >= 10;

    // Save
    const data = localStorage.getItem(this.STORAGE_KEY);
    const allProgress: Record<string, TopicProgress> = data ? JSON.parse(data) : {};
    allProgress[topicId] = current;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));

    return current;
  }

  static getAllProgress(): TopicProgress[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    const progress: Record<string, TopicProgress> = JSON.parse(data);
    return Object.values(progress);
  }
}
```

**Integration**:
```typescript
// When answer is submitted
import { ProgressTracker } from '../../lib/progress-tracker';

const topicProgress = ProgressTracker.updateProgress(
  'upper-limb-anatomy',
  'Upper Limb Anatomy',
  isCorrect
);

// Award mastery XP
if (topicProgress.mastered && topicProgress.questionsAttempted === 10) {
  awardXPWithFeedback(XP_REWARDS.TOPIC_MASTERED, '🏆 Topic Mastered!');
}
```

**Estimated Time**: 2 hours

---

## 🟡 Medium Tier (3-6 hours each)

### M1. Skill Tree Visualization

**Goal**: Visual tree showing topic dependencies and progress

**Files to Create**:
- `components/layout/SkillTreePanel.tsx`
- `components/SkillTreeNode.tsx`
- `lib/skill-tree-data.ts`

**Data Structure**:
```typescript
// lib/skill-tree-data.ts
export interface SkillNode {
  id: string;
  name: string;
  icon: string;
  level: number; // Depth in tree (1 = root, 2 = branch, etc.)
  prerequisites: string[]; // IDs of required nodes
  position: { x: number; y: number }; // Canvas position
  status: 'locked' | 'available' | 'in-progress' | 'mastered';
  progress: number; // 0-100
}

export const SKILL_TREE: SkillNode[] = [
  // Root nodes (fundamentals)
  {
    id: 'anatomy-basics',
    name: 'Anatomy Basics',
    icon: '🦴',
    level: 1,
    prerequisites: [],
    position: { x: 400, y: 100 },
    status: 'mastered',
    progress: 100,
  },

  // Branch nodes (specializations)
  {
    id: 'upper-limb',
    name: 'Upper Limb',
    icon: '💪',
    level: 2,
    prerequisites: ['anatomy-basics'],
    position: { x: 300, y: 250 },
    status: 'in-progress',
    progress: 67,
  },

  {
    id: 'lower-limb',
    name: 'Lower Limb',
    icon: '🦵',
    level: 2,
    prerequisites: ['anatomy-basics'],
    position: { x: 500, y: 250 },
    status: 'available',
    progress: 0,
  },

  // Advanced nodes
  {
    id: 'surgical-anatomy',
    name: 'Surgical Anatomy',
    icon: '🔬',
    level: 3,
    prerequisites: ['upper-limb', 'lower-limb'],
    position: { x: 400, y: 400 },
    status: 'locked',
    progress: 0,
  },
];
```

**Component**:
```typescript
// components/SkillTreeNode.tsx
import { animate as anime } from 'animejs';

interface SkillTreeNodeProps {
  node: SkillNode;
  onClick: (node: SkillNode) => void;
}

export function SkillTreeNode({ node, onClick }: SkillTreeNodeProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Pulse animation for available nodes
  useEffect(() => {
    if (node.status === 'available' && ref.current) {
      anime(ref.current, {
        scale: { from: 1, to: 1.1 },
        alternate: true,
        loop: true,
        duration: 1500,
        ease: 'inOutSine',
      });
    }
  }, [node.status]);

  const getNodeStyles = () => {
    const baseClass = 'skill-node relative w-20 h-20 rounded-full flex items-center justify-center text-3xl cursor-pointer transition-all';

    switch (node.status) {
      case 'mastered':
        return `${baseClass} bg-gradient-to-br from-accent-analysis to-accent-trust shadow-glow-cyan`;
      case 'in-progress':
        return `${baseClass} bg-gradient-to-br from-accent-mastery/50 to-accent-trust/50 glow-border`;
      case 'available':
        return `${baseClass} bg-secondary border-2 border-accent-trust hover:scale-110`;
      case 'locked':
      default:
        return `${baseClass} bg-tertiary/20 opacity-40 cursor-not-allowed`;
    }
  };

  return (
    <div
      ref={ref}
      className={getNodeStyles()}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
      }}
      onClick={() => node.status !== 'locked' && onClick(node)}
    >
      <span>{node.icon}</span>

      {/* Progress ring */}
      {node.progress > 0 && (
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="38"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${node.progress * 2.4} 240`}
            className="text-accent-trust"
          />
        </svg>
      )}

      {/* Name tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap">
        {node.name}
      </div>
    </div>
  );
}
```

**Panel Component**:
```typescript
// components/layout/SkillTreePanel.tsx
export function SkillTreePanel() {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Draw connection lines between nodes
  useEffect(() => {
    if (!canvasRef.current) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'absolute inset-0 w-full h-full pointer-events-none');

    SKILL_TREE.forEach(node => {
      node.prerequisites.forEach(prereqId => {
        const prereq = SKILL_TREE.find(n => n.id === prereqId);
        if (!prereq) return;

        // Draw line from prereq to node
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(prereq.position.x + 40));
        line.setAttribute('y1', String(prereq.position.y + 40));
        line.setAttribute('x2', String(node.position.x + 40));
        line.setAttribute('y2', String(node.position.y + 40));
        line.setAttribute('stroke', 'var(--accent-trust)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('opacity', node.status === 'locked' ? '0.2' : '0.5');
        svg.appendChild(line);
      });
    });

    canvasRef.current.appendChild(svg);
  }, []);

  return (
    <div className="relative h-full overflow-auto">
      <div ref={canvasRef} className="relative min-h-[600px]">
        {SKILL_TREE.map(node => (
          <SkillTreeNode
            key={node.id}
            node={node}
            onClick={setSelectedNode}
          />
        ))}
      </div>

      {/* Node details modal */}
      {selectedNode && (
        <NodeDetailsModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
```

**Estimated Time**: 4-6 hours

---

### M2. Achievement System

**Goal**: Unlock and display achievement badges

**Files to Create**:
- `lib/achievements.ts`
- `lib/hooks/useAchievements.tsx`
- `components/AchievementToast.tsx`
- `components/AchievementGallery.tsx`

**Data Structure**:
```typescript
// lib/achievements.ts
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (stats: UserStats) => boolean;
  xpReward: number;
  hidden?: boolean; // Don't show until unlocked
}

export interface UserStats {
  totalQuestions: number;
  correctAnswers: number;
  lessonsCompleted: number;
  perfectLessons: number;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  topicsMastered: number;
  fastAnswers: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Common achievements
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Answer your first question correctly',
    icon: '👶',
    rarity: 'common',
    condition: (stats) => stats.correctAnswers >= 1,
    xpReward: 50,
  },

  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Answer 10 questions correctly',
    icon: '🧠',
    rarity: 'common',
    condition: (stats) => stats.correctAnswers >= 10,
    xpReward: 100,
  },

  // Rare achievements
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    icon: '🔥',
    rarity: 'rare',
    condition: (stats) => stats.currentStreak >= 7,
    xpReward: 200,
  },

  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a lesson with 100% accuracy',
    icon: '🎯',
    rarity: 'rare',
    condition: (stats) => stats.perfectLessons >= 1,
    xpReward: 250,
  },

  // Epic achievements
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Answer 50 questions in under 5 seconds each',
    icon: '⚡',
    rarity: 'epic',
    condition: (stats) => stats.fastAnswers >= 50,
    xpReward: 500,
  },

  {
    id: 'master-of-one',
    name: 'Master of One',
    description: 'Achieve mastery in any topic',
    icon: '🏆',
    rarity: 'epic',
    condition: (stats) => stats.topicsMastered >= 1,
    xpReward: 750,
  },

  // Legendary achievements
  {
    id: 'century-club',
    name: 'Century Club',
    description: 'Reach level 100',
    icon: '💯',
    rarity: 'legendary',
    condition: (stats) => stats.level >= 100,
    xpReward: 5000,
    hidden: true,
  },

  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 30-day streak',
    icon: '🚀',
    rarity: 'legendary',
    condition: (stats) => stats.currentStreak >= 30,
    xpReward: 2000,
  },
];
```

**Achievement Hook**:
```typescript
// lib/hooks/useAchievements.tsx
export function useAchievements() {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const { progress } = useXP();

  // Load unlocked achievements
  useEffect(() => {
    const stored = localStorage.getItem('studyin-achievements');
    if (stored) {
      setUnlockedAchievements(JSON.parse(stored));
    }
  }, []);

  // Check for new achievements
  const checkAchievements = useCallback((stats: UserStats) => {
    const newUnlocks: Achievement[] = [];

    ACHIEVEMENTS.forEach(achievement => {
      // Skip if already unlocked
      if (unlockedAchievements.includes(achievement.id)) return;

      // Check condition
      if (achievement.condition(stats)) {
        newUnlocks.push(achievement);
      }
    });

    if (newUnlocks.length > 0) {
      const newIds = newUnlocks.map(a => a.id);
      const updated = [...unlockedAchievements, ...newIds];
      setUnlockedAchievements(updated);
      localStorage.setItem('studyin-achievements', JSON.stringify(updated));

      // Show notification for first unlock
      setNewAchievement(newUnlocks[0]);

      return newUnlocks;
    }

    return [];
  }, [unlockedAchievements]);

  return {
    unlockedAchievements,
    newAchievement,
    setNewAchievement,
    checkAchievements,
  };
}
```

**Toast Component**:
```typescript
// components/AchievementToast.tsx
export function AchievementToast({ achievement, onDismiss }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Slide in from left
    anime(ref.current, {
      translateX: { from: -100, to: 0 },
      opacity: { from: 0, to: 1 },
      duration: 600,
      ease: 'outBack',
    });

    // Auto-dismiss
    const timeout = setTimeout(() => {
      anime(ref.current, {
        translateX: { from: 0, to: -100 },
        opacity: { from: 1, to: 0 },
        duration: 400,
        ease: 'inQuad',
        onComplete: () => onDismiss?.(),
      });
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const getRarityColor = () => {
    switch (achievement.rarity) {
      case 'legendary': return 'from-yellow-500 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div
      ref={ref}
      className={`fixed top-24 left-4 z-[60] p-4 rounded-lg bg-gradient-to-r ${getRarityColor()} text-white shadow-2xl min-w-[300px]`}
    >
      <div className="flex items-center gap-4">
        <div className="text-4xl animate-bounce">{achievement.icon}</div>
        <div>
          <div className="text-sm uppercase tracking-wider opacity-80">
            Achievement Unlocked!
          </div>
          <div className="text-xl font-black">{achievement.name}</div>
          <div className="text-sm opacity-90">{achievement.description}</div>
          <div className="text-xs mt-1">+{achievement.xpReward} XP</div>
        </div>
      </div>
    </div>
  );
}
```

**Gallery Component**:
```typescript
// components/AchievementGallery.tsx
export function AchievementGallery() {
  const { unlockedAchievements } = useAchievements();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-6">
      {ACHIEVEMENTS.map(achievement => {
        const unlocked = unlockedAchievements.includes(achievement.id);
        const isHidden = achievement.hidden && !unlocked;

        if (isHidden) return null;

        return (
          <div
            key={achievement.id}
            className={`achievement-card p-4 rounded-lg text-center ${
              unlocked
                ? 'glow-border bg-secondary'
                : 'opacity-40 grayscale bg-tertiary/20'
            }`}
          >
            <div className="text-4xl mb-2">{achievement.icon}</div>
            <div className="text-sm font-bold">{achievement.name}</div>
            <div className="text-xs text-tertiary mt-1">
              {achievement.description}
            </div>
            {unlocked && (
              <div className="text-xs accent-mastery mt-2">
                +{achievement.xpReward} XP
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**Integration**:
```typescript
// In components where actions happen
import { useAchievements } from '../lib/hooks/useAchievements';

const { checkAchievements, newAchievement, setNewAchievement } = useAchievements();

// After any significant action
const stats: UserStats = {
  totalQuestions: /* from state */,
  correctAnswers: /* from state */,
  // ... other stats
};

const newUnlocks = checkAchievements(stats);
if (newUnlocks.length > 0) {
  // Achievement unlocked!
  audioManager.play('achievement');
}

// Render achievement toast
{newAchievement && (
  <AchievementToast
    achievement={newAchievement}
    onDismiss={() => setNewAchievement(null)}
  />
)}
```

**Estimated Time**: 5-6 hours

---

### M3. Enhanced Telemetry with Real Data

**Goal**: Wire telemetry panel to actual study data

**Files to Modify**:
- `components/layout/AppShell.tsx` (telemetry section)

**Files to Create**:
- `lib/hooks/useSessionStats.tsx`
- `lib/session-tracker.ts`

**Session Tracker**:
```typescript
// lib/session-tracker.ts
export interface SessionData {
  sessionId: string;
  startTime: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number; // ms
  xpEarned: number;
  topicsStudied: string[];
}

export class SessionTracker {
  private static currentSession: SessionData | null = null;

  static startSession(): SessionData {
    this.currentSession = {
      sessionId: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      xpEarned: 0,
      topicsStudied: [],
    };
    return this.currentSession;
  }

  static recordAnswer(
    isCorrect: boolean,
    timeMs: number,
    topicId: string
  ) {
    if (!this.currentSession) this.startSession();

    this.currentSession!.questionsAnswered++;
    if (isCorrect) this.currentSession!.correctAnswers++;

    // Update accuracy
    this.currentSession!.accuracy =
      this.currentSession!.correctAnswers / this.currentSession!.questionsAnswered;

    // Update average time
    const total = this.currentSession!.averageTime * (this.currentSession!.questionsAnswered - 1);
    this.currentSession!.averageTime = (total + timeMs) / this.currentSession!.questionsAnswered;

    // Track topics
    if (!this.currentSession!.topicsStudied.includes(topicId)) {
      this.currentSession!.topicsStudied.push(topicId);
    }
  }

  static recordXP(amount: number) {
    if (!this.currentSession) return;
    this.currentSession.xpEarned += amount;
  }

  static getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  static endSession() {
    if (!this.currentSession) return;

    // Save to history
    const history = this.getHistory();
    history.push(this.currentSession);
    localStorage.setItem('studyin-session-history', JSON.stringify(history));

    this.currentSession = null;
  }

  static getHistory(): SessionData[] {
    const data = localStorage.getItem('studyin-session-history');
    return data ? JSON.parse(data) : [];
  }
}
```

**Session Stats Hook**:
```typescript
// lib/hooks/useSessionStats.tsx
export function useSessionStats() {
  const [session, setSession] = useState<SessionData | null>(null);

  // Start session on mount
  useEffect(() => {
    const current = SessionTracker.getCurrentSession() || SessionTracker.startSession();
    setSession(current);

    // Update every second
    const interval = setInterval(() => {
      setSession(SessionTracker.getCurrentSession());
    }, 1000);

    return () => {
      clearInterval(interval);
      SessionTracker.endSession();
    };
  }, []);

  return session;
}
```

**Updated Telemetry Panel**:
```typescript
// In AppShell.tsx
import { useSessionStats } from '../../lib/hooks/useSessionStats';

export function AppShell() {
  const session = useSessionStats();
  const { progress, levelInfo } = useXP();

  // Calculate session duration
  const sessionDuration = session
    ? Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000 / 60)
    : 0;

  return (
    <aside className="telemetry-panel">
      {/* Live Stats */}
      <div className="mission-card">
        <h3>LIVE STATS</h3>
        <StatBar
          label="Accuracy"
          value={Math.round((session?.accuracy || 0) * 100)}
          color="accent-analysis"
        />
        <StatBar
          label="Avg Speed"
          value={`${Math.round((session?.averageTime || 0) / 1000)}s`}
          color="accent-trust"
        />
      </div>

      {/* Session Info */}
      <div className="mission-card">
        <h3>SESSION</h3>
        <Stat label="Questions" value={session?.questionsAnswered || 0} />
        <Stat label="Time" value={`${sessionDuration}m`} />
        <Stat label="XP Earned" value={`+${session?.xpEarned || 0}`} />
      </div>

      {/* Patterns (AI-detected) */}
      <div className="mission-card">
        <h3>PATTERNS</h3>
        {generatePatterns(session, progress)}
      </div>
    </aside>
  );
}

function generatePatterns(session: SessionData | null, progress: UserProgress) {
  const patterns = [];

  if (session && session.accuracy >= 0.9) {
    patterns.push({ icon: '✓', text: 'Excellent accuracy today', type: 'positive' });
  }

  if (session && session.averageTime < 10000) {
    patterns.push({ icon: '⚡', text: 'Fast response times', type: 'positive' });
  }

  if (progress.streak >= 7) {
    patterns.push({ icon: '🔥', text: 'Strong study streak', type: 'positive' });
  }

  if (session && session.accuracy < 0.6) {
    patterns.push({ icon: '⚠', text: 'Review recommended', type: 'warning' });
  }

  return patterns;
}
```

**Estimated Time**: 4-5 hours

---

### M4. Analytics Dashboard

**Goal**: Comprehensive analytics page with graphs

**Files to Create**:
- `app/analytics/page.tsx`
- `components/analytics/XPGraph.tsx`
- `components/analytics/AccuracyGraph.tsx`
- `components/analytics/TopicBreakdown.tsx`
- `components/analytics/StreakCalendar.tsx`

**Page Structure**:
```typescript
// app/analytics/page.tsx
import { AppShell } from '../../components/layout/AppShell';
import { XPGraph } from '../../components/analytics/XPGraph';
import { AccuracyGraph } from '../../components/analytics/AccuracyGraph';
import { TopicBreakdown } from '../../components/analytics/TopicBreakdown';
import { StreakCalendar } from '../../components/analytics/StreakCalendar';

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="p-6 space-y-6">
        <h1 className="text-4xl font-black holographic">Analytics Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <OverviewCard icon="📊" label="Total XP" value="45,230" />
          <OverviewCard icon="🎯" label="Accuracy" value="87%" />
          <OverviewCard icon="⚡" label="Questions" value="1,234" />
          <OverviewCard icon="🔥" label="Streak" value="14 days" />
        </div>

        {/* Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <XPGraph />
          <AccuracyGraph />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopicBreakdown />
          <StreakCalendar />
        </div>
      </div>
    </AppShell>
  );
}
```

**XP Graph** (using Chart.js or Recharts):
```typescript
// components/analytics/XPGraph.tsx
import { Line } from 'recharts';

export function XPGraph() {
  const data = getXPHistory(); // From session history

  return (
    <div className="mission-card p-6">
      <h3 className="text-xl font-bold mb-4">XP Over Time</h3>
      <Line
        data={data}
        xField="date"
        yField="xp"
        color="var(--accent-trust)"
        height={300}
      />
    </div>
  );
}
```

**Estimated Time**: 5-6 hours

---

### M5. Mobile Responsive Layout

**Goal**: Optimize layout for mobile devices

**Files to Modify**:
- `components/layout/AppShell.tsx`
- `app/globals.css` (add mobile breakpoints)

**Implementation**:
```typescript
// AppShell.tsx with responsive behavior
export function AppShell({ children }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Mobile: Hamburger menu */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-[70]">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="neon-button p-3 rounded-lg"
          >
            ☰
          </button>
        </div>
      )}

      {/* Sidebars - slide in on mobile */}
      <aside
        className={`
          fixed lg:relative
          ${isMobile ? 'left-0 top-0 h-screen z-[60]' : ''}
          ${isMobile && !navOpen ? '-translate-x-full' : 'translate-x-0'}
          transition-transform duration-300
        `}
      >
        {/* Mission panel content */}
      </aside>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Telemetry - hide on mobile, show in modal */}
      {!isMobile ? (
        <aside>{/* Telemetry content */}</aside>
      ) : (
        contextOpen && (
          <div className="fixed inset-0 z-[60] bg-black/80">
            <div className="fixed right-0 top-0 h-screen w-80 bg-primary">
              {/* Telemetry content */}
            </div>
          </div>
        )
      )}
    </div>
  );
}
```

**Estimated Time**: 4-5 hours

---

### M6. Settings Panel

**Goal**: User settings (theme, sound, notifications)

**Files to Create**:
- `app/settings/page.tsx`
- `components/settings/SettingsSection.tsx`

**Implementation**:
```typescript
// app/settings/page.tsx
export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-black holographic">Settings</h1>

        {/* Theme Settings */}
        <SettingsSection title="Appearance">
          <SettingRow label="Theme">
            <ThemeToggle />
          </SettingRow>
          <SettingRow label="Animations">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
        </SettingsSection>

        {/* Audio Settings */}
        <SettingsSection title="Audio">
          <SettingRow label="Sound Effects">
            <Toggle
              value={soundEnabled}
              onChange={(val) => {
                setSoundEnabled(val);
                audioManager.toggle();
              }}
            />
          </SettingRow>
          <SettingRow label="Volume">
            <Slider min={0} max={100} value={50} />
          </SettingRow>
        </SettingsSection>

        {/* Study Settings */}
        <SettingsSection title="Study">
          <SettingRow label="Auto-advance">
            <Toggle value={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow label="Question timer">
            <Toggle value={false} onChange={() => {}} />
          </SettingRow>
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection title="Data">
          <button
            className="neon-button px-4 py-2 rounded-lg"
            onClick={() => {
              if (confirm('Reset all progress?')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
          >
            🔄 Reset All Progress
          </button>
        </SettingsSection>
      </div>
    </AppShell>
  );
}
```

**Estimated Time**: 3-4 hours

---

## 🔴 Hard Tier (1-2 days each)

### H1. Advanced Analytics with ML Insights

**Goal**: AI-powered learning pattern detection

**Files to Create**:
- `lib/ml/pattern-detector.ts`
- `components/analytics/LearningInsights.tsx`
- `components/analytics/PredictiveGraph.tsx`

**Pattern Detector**:
```typescript
// lib/ml/pattern-detector.ts
export interface LearningPattern {
  type: 'strength' | 'weakness' | 'trend' | 'prediction';
  title: string;
  description: string;
  confidence: number; // 0-1
  data: any;
}

export class PatternDetector {
  /**
   * Detect time-of-day performance patterns
   */
  static detectTimePatterns(sessions: SessionData[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Group by hour
    const hourlyPerformance = new Map<number, { total: number; correct: number }>();

    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const stats = hourlyPerformance.get(hour) || { total: 0, correct: 0 };
      stats.total += session.questionsAnswered;
      stats.correct += session.correctAnswers;
      hourlyPerformance.set(hour, stats);
    });

    // Find best hours
    let bestHour = 0;
    let bestAccuracy = 0;

    hourlyPerformance.forEach((stats, hour) => {
      const accuracy = stats.correct / stats.total;
      if (accuracy > bestAccuracy && stats.total >= 10) {
        bestAccuracy = accuracy;
        bestHour = hour;
      }
    });

    if (bestAccuracy > 0) {
      patterns.push({
        type: 'strength',
        title: 'Peak Performance Time',
        description: `You perform best around ${bestHour}:00 with ${Math.round(bestAccuracy * 100)}% accuracy`,
        confidence: Math.min(1, hourlyPerformance.get(bestHour)!.total / 50),
        data: { hour: bestHour, accuracy: bestAccuracy },
      });
    }

    return patterns;
  }

  /**
   * Detect topic strength/weakness patterns
   */
  static detectTopicPatterns(progress: TopicProgress[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Strongest topics
    const strengths = progress
      .filter(p => p.accuracy >= 0.9 && p.questionsAttempted >= 10)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    if (strengths.length > 0) {
      patterns.push({
        type: 'strength',
        title: 'Mastered Topics',
        description: `You excel at ${strengths.map(s => s.topicName).join(', ')}`,
        confidence: 0.9,
        data: strengths,
      });
    }

    // Weakest topics
    const weaknesses = progress
      .filter(p => p.accuracy < 0.6 && p.questionsAttempted >= 10)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    if (weaknesses.length > 0) {
      patterns.push({
        type: 'weakness',
        title: 'Topics Needing Review',
        description: `Focus on ${weaknesses.map(w => w.topicName).join(', ')}`,
        confidence: 0.85,
        data: weaknesses,
      });
    }

    return patterns;
  }

  /**
   * Predict level-up date based on recent XP rate
   */
  static predictLevelUp(sessions: SessionData[], currentLevel: number): LearningPattern | null {
    if (sessions.length < 5) return null;

    // Calculate recent XP rate (last 7 days)
    const recentSessions = sessions.slice(-7);
    const totalXP = recentSessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const dailyRate = totalXP / 7;

    // Get XP needed for next level
    const xpNeeded = getXPForLevel(currentLevel + 1);
    const daysToLevelUp = Math.ceil(xpNeeded / dailyRate);

    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysToLevelUp);

    return {
      type: 'prediction',
      title: 'Level Up Prediction',
      description: `At your current pace, you'll reach level ${currentLevel + 1} in ${daysToLevelUp} days`,
      confidence: Math.min(1, sessions.length / 20), // More data = higher confidence
      data: {
        daysToLevelUp,
        predictedDate: predictedDate.toISOString().split('T')[0],
        dailyRate,
      },
    };
  }

  /**
   * Detect learning velocity trends
   */
  static detectTrends(sessions: SessionData[]): LearningPattern[] {
    if (sessions.length < 10) return [];

    const patterns: LearningPattern[] = [];

    // Compare first half vs second half
    const midpoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midpoint);
    const secondHalf = sessions.slice(midpoint);

    const firstAvgAccuracy = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
    const secondAvgAccuracy = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

    const improvement = secondAvgAccuracy - firstAvgAccuracy;

    if (improvement > 0.1) {
      patterns.push({
        type: 'trend',
        title: 'Improving Performance',
        description: `Your accuracy has improved by ${Math.round(improvement * 100)}% recently`,
        confidence: 0.8,
        data: { improvement, firstAvg: firstAvgAccuracy, secondAvg: secondAvgAccuracy },
      });
    } else if (improvement < -0.1) {
      patterns.push({
        type: 'trend',
        title: 'Performance Dip',
        description: `Consider taking a break or reviewing fundamentals`,
        confidence: 0.7,
        data: { decline: Math.abs(improvement) },
      });
    }

    return patterns;
  }

  /**
   * Run all pattern detectors
   */
  static analyzeAll(
    sessions: SessionData[],
    progress: TopicProgress[],
    currentLevel: number
  ): LearningPattern[] {
    return [
      ...this.detectTimePatterns(sessions),
      ...this.detectTopicPatterns(progress),
      ...this.detectTrends(sessions),
      this.predictLevelUp(sessions, currentLevel),
    ].filter(Boolean) as LearningPattern[];
  }
}
```

**Insights Component**:
```typescript
// components/analytics/LearningInsights.tsx
export function LearningInsights() {
  const [insights, setInsights] = useState<LearningPattern[]>([]);
  const { progress, levelInfo } = useXP();

  useEffect(() => {
    const sessions = SessionTracker.getHistory();
    const topicProgress = ProgressTracker.getAllProgress();
    const patterns = PatternDetector.analyzeAll(sessions, topicProgress, levelInfo.level);
    setInsights(patterns);
  }, [levelInfo.level]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black holographic">AI Insights</h2>

      {insights.map((insight, i) => (
        <div
          key={i}
          className={`mission-card p-4 ${
            insight.type === 'weakness' ? 'border-warning' :
            insight.type === 'strength' ? 'border-accent-analysis' :
            'glow-border-subtle'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {insight.type === 'strength' ? '✓' :
               insight.type === 'weakness' ? '⚠' :
               insight.type === 'trend' ? '📈' : '🔮'}
            </div>
            <div className="flex-1">
              <h3 className="font-bold mb-1">{insight.title}</h3>
              <p className="text-sm text-secondary">{insight.description}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-tertiary">
                  Confidence: {Math.round(insight.confidence * 100)}%
                </div>
                <div className="h-1 flex-1 bg-tertiary/20 rounded-full">
                  <div
                    className="h-full bg-accent-trust rounded-full"
                    style={{ width: `${insight.confidence * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Estimated Time**: 1-2 days

---

### H2. 3D Anatomy Viewer Integration

**Goal**: Interactive 3D models with Three.js

**Files to Create**:
- `components/3d/AnatomyViewer.tsx`
- `lib/3d/model-loader.ts`
- `lib/3d/camera-controls.ts`

**Note**: This is a complex feature requiring:
- Three.js setup
- GLTF model loading
- Camera controls
- Annotation system
- Touch/mouse interaction

**High-level Structure**:
```typescript
// components/3d/AnatomyViewer.tsx
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function AnatomyViewer({ modelPath, annotations }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    containerRef.current.appendChild(renderer.domElement);

    // Setup controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Setup lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load model
    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
      scene.add(gltf.scene);
    });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Cleanup
    return () => {
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [modelPath]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] rounded-lg overflow-hidden glass-max"
    >
      {/* Annotation overlays */}
      {annotations.map((annotation, i) => (
        <Annotation
          key={i}
          position={annotation.position}
          label={annotation.label}
          onClick={() => handleAnnotationClick(annotation)}
        />
      ))}

      {/* Controls UI */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button className="neon-button p-2 rounded-lg">🔄 Rotate</button>
        <button className="neon-button p-2 rounded-lg">🔍 Zoom</button>
        <button className="neon-button p-2 rounded-lg">🎯 Reset</button>
      </div>
    </div>
  );
}
```

**Estimated Time**: 2 days

---

### H3. Spaced Repetition Algorithm

**Goal**: Intelligent question scheduling based on performance

**Files to Create**:
- `lib/srs/scheduler.ts`
- `lib/srs/sm2-algorithm.ts`

**Implementation**:
```typescript
// lib/srs/scheduler.ts
export interface CardReview {
  cardId: string;
  questionId: string;
  ease: number; // Difficulty (1.3 = hard, 2.5 = easy)
  interval: number; // Days until next review
  repetitions: number; // Times reviewed
  lastReview: string;
  nextReview: string;
}

/**
 * SM-2 (SuperMemo 2) Algorithm
 * https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
 */
export class SRSScheduler {
  /**
   * Calculate next review date based on quality of recall
   * @param quality 0-5 (0 = total blackout, 5 = perfect recall)
   */
  static scheduleNext(
    currentCard: CardReview,
    quality: number
  ): CardReview {
    const newCard = { ...currentCard };

    // Update ease factor
    newCard.ease = Math.max(
      1.3,
      newCard.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Update repetitions
    if (quality < 3) {
      // Failed - reset
      newCard.repetitions = 0;
      newCard.interval = 1;
    } else {
      newCard.repetitions++;

      if (newCard.repetitions === 1) {
        newCard.interval = 1;
      } else if (newCard.repetitions === 2) {
        newCard.interval = 6;
      } else {
        newCard.interval = Math.round(newCard.interval * newCard.ease);
      }
    }

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + newCard.interval);
    newCard.nextReview = nextDate.toISOString();
    newCard.lastReview = new Date().toISOString();

    return newCard;
  }

  /**
   * Get all cards due for review
   */
  static getDueCards(): CardReview[] {
    const data = localStorage.getItem('studyin-srs-cards');
    if (!data) return [];

    const cards: CardReview[] = JSON.parse(data);
    const now = new Date().toISOString();

    return cards.filter(card => card.nextReview <= now);
  }

  /**
   * Convert answer correctness to quality score
   */
  static qualityFromAnswer(
    isCorrect: boolean,
    timeTaken: number,
    confidence: number
  ): number {
    if (!isCorrect) return 0;

    // Fast + confident = 5
    // Slow + uncertain = 3
    if (timeTaken < 5000 && confidence > 0.8) return 5;
    if (timeTaken < 10000 && confidence > 0.6) return 4;
    if (isCorrect) return 3;

    return 0;
  }
}
```

**Integration**:
```typescript
// In question handling
const quality = SRSScheduler.qualityFromAnswer(
  isCorrect,
  timeTaken,
  confidenceRating
);

const currentCard = SRSScheduler.getCard(questionId);
const updatedCard = SRSScheduler.scheduleNext(currentCard, quality);
SRSScheduler.saveCard(updatedCard);

// Show next review date
console.log(`Next review in ${updatedCard.interval} days`);
```

**Estimated Time**: 1-2 days

---

### H4. Offline Support with Service Worker

**Goal**: Full offline functionality

**Files to Create**:
- `public/sw.js`
- `lib/offline/cache-manager.ts`
- `lib/offline/sync-queue.ts`

**Service Worker**:
```javascript
// public/sw.js
const CACHE_NAME = 'studyin-v1';
const urlsToCache = [
  '/',
  '/study',
  '/analytics',
  '/manifest.json',
  '/sounds/xp-gain.mp3',
  '/sounds/level-up.mp3',
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  const queue = await getQueue();

  for (const item of queue) {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(item),
      });
      await removeFromQueue(item.id);
    } catch (err) {
      console.error('Sync failed:', err);
    }
  }
}
```

**Registration**:
```typescript
// In app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('Service Worker registered:', reg);
    });
  }
}, []);
```

**Offline Queue**:
```typescript
// lib/offline/sync-queue.ts
export class SyncQueue {
  static async add(action: string, data: any) {
    const queue = await this.getQueue();
    queue.push({
      id: Date.now(),
      action,
      data,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('studyin-sync-queue', JSON.stringify(queue));

    // Request background sync
    if ('serviceWorker' in navigator && 'sync' in registration) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-progress');
    }
  }

  static async getQueue() {
    const data = localStorage.getItem('studyin-sync-queue');
    return data ? JSON.parse(data) : [];
  }
}
```

**Estimated Time**: 1-2 days

---

### H5. Advanced Search & Filtering

**Goal**: Search questions, topics, notes with fuzzy matching

**Files to Create**:
- `components/SearchBar.tsx`
- `lib/search/fuzzy-search.ts`
- `lib/search/indexer.ts`

**Fuzzy Search**:
```typescript
// lib/search/fuzzy-search.ts
export interface SearchResult {
  id: string;
  type: 'question' | 'topic' | 'note';
  title: string;
  content: string;
  score: number;
  highlights: string[];
}

export class FuzzySearch {
  /**
   * Levenshtein distance for fuzzy matching
   */
  static levenshtein(a: string, b: string): number {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Search with fuzzy matching
   */
  static search(
    query: string,
    items: Array<{ id: string; title: string; content: string; type: string }>,
    threshold: number = 0.6
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      // Exact match (highest score)
      if (titleLower.includes(lowerQuery) || contentLower.includes(lowerQuery)) {
        results.push({
          id: item.id,
          type: item.type as any,
          title: item.title,
          content: item.content,
          score: 1.0,
          highlights: this.extractHighlights(item.content, query),
        });
        return;
      }

      // Fuzzy match
      const titleDistance = this.levenshtein(lowerQuery, titleLower);
      const titleScore = 1 - titleDistance / Math.max(lowerQuery.length, titleLower.length);

      if (titleScore >= threshold) {
        results.push({
          id: item.id,
          type: item.type as any,
          title: item.title,
          content: item.content,
          score: titleScore,
          highlights: [],
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }

  static extractHighlights(text: string, query: string): string[] {
    const words = text.split(' ');
    const highlights: string[] = [];

    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes(query.toLowerCase())) {
        const start = Math.max(0, i - 3);
        const end = Math.min(words.length, i + 4);
        highlights.push(words.slice(start, end).join(' '));
      }
    }

    return highlights;
  }
}
```

**Search Bar Component**:
```typescript
// components/SearchBar.tsx
export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useMemo(
    () =>
      debounce((q: string) => {
        if (q.length < 2) {
          setResults([]);
          return;
        }

        // Get all searchable items
        const items = [
          ...getAllQuestions(),
          ...getAllTopics(),
          ...getAllNotes(),
        ];

        const searchResults = FuzzySearch.search(q, items);
        setResults(searchResults);
        setIsOpen(true);
      }, 300),
    []
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        placeholder="Search questions, topics..."
        className="w-full px-4 py-2 rounded-lg glass-max border glow-border-subtle"
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-max border glow-border rounded-lg max-h-96 overflow-auto">
          {results.map(result => (
            <Link
              key={result.id}
              href={getResultUrl(result)}
              className="block p-3 hover:bg-secondary/20 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-1 rounded bg-accent-trust/20 text-accent-trust">
                  {result.type}
                </span>
                <span className="text-xs text-tertiary">
                  {Math.round(result.score * 100)}% match
                </span>
              </div>
              <div className="font-bold">{result.title}</div>
              {result.highlights.length > 0 && (
                <div className="text-xs text-secondary mt-1">
                  ...{result.highlights[0]}...
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Estimated Time**: 1 day

---

## Implementation Order

### Sprint 1 (Week 1): Foundation
1. **E1**: Connect XP to questions (1-2h)
2. **E2**: Connect XP to lessons (1h)
3. **E3**: Update landing page (1h)
4. **E4**: Daily streak tracker (1h)
5. **E6**: Topic progress tracking (2h)
6. **Test thoroughly**

**Goal**: Core XP system fully functional

---

### Sprint 2 (Week 2): Gamification
1. **M2**: Achievement system (5-6h)
2. **E5**: Sound effects (2h)
3. **M1**: Skill tree visualization (4-6h)
4. **Test achievements and skill tree**

**Goal**: Full gamification loop complete

---

### Sprint 3 (Week 3): Analytics
1. **M3**: Enhanced telemetry (4-5h)
2. **M4**: Analytics dashboard (5-6h)
3. **M5**: Mobile responsive (4-5h)
4. **M6**: Settings panel (3-4h)

**Goal**: Production-ready analytics

---

### Sprint 4 (Week 4): Advanced Features
1. **H1**: ML insights (1-2 days)
2. **H3**: Spaced repetition (1-2 days)
3. **H5**: Advanced search (1 day)

**Goal**: AI-powered learning

---

### Sprint 5 (Week 5+): Polish
1. **H2**: 3D anatomy viewer (2 days)
2. **H4**: Offline support (1-2 days)
3. **Performance optimization**
4. **Bug fixes and polish**

**Goal**: Production-ready, feature-complete

---

## File Structure

```
/Studyin
  /app
    /globals.css (630 lines - MAX GRAPHICS)
    /layout.tsx
    /page.tsx
    /providers.tsx

    /study
      /page.tsx

    /analytics
      /page.tsx

    /settings
      /page.tsx

  /lib
    /xp-system.ts
    /progress-tracker.ts
    /achievements.ts
    /audio.ts
    /session-tracker.ts
    /skill-tree-data.ts

    /hooks
      /useXPSystem.tsx
      /useAchievements.tsx
      /useDailyStreak.tsx
      /useSessionStats.tsx

    /ml
      /pattern-detector.ts

    /srs
      /scheduler.ts
      /sm2-algorithm.ts

    /search
      /fuzzy-search.ts
      /indexer.ts

    /offline
      /cache-manager.ts
      /sync-queue.ts

    /3d
      /model-loader.ts
      /camera-controls.ts

  /components
    /XPProvider.tsx
    /Mascot.tsx
    /ThemeProvider.tsx

    /layout
      /AppShell.tsx (400+ lines)
      /SkillTreePanel.tsx

    /effects
      /LevelUpBurst.tsx
      /XPGainToast.tsx
      /ConfettiBurst.tsx
      /MasteryBurst.tsx

    /dev
      /XPDevPanel.tsx

    /analytics
      /XPGraph.tsx
      /AccuracyGraph.tsx
      /TopicBreakdown.tsx
      /StreakCalendar.tsx
      /LearningInsights.tsx
      /PredictiveGraph.tsx

    /3d
      /AnatomyViewer.tsx
      /Annotation.tsx

    /settings
      /SettingsSection.tsx
      /SettingRow.tsx

    /atoms
      /ThemeToggle.tsx
      /Toggle.tsx
      /Slider.tsx

    /SkillTreeNode.tsx
    /AchievementToast.tsx
    /AchievementGallery.tsx
    /SearchBar.tsx
    /NodeDetailsModal.tsx

  /public
    /sw.js
    /sounds
      /xp-gain.mp3
      /level-up.mp3
      /achievement.mp3
    /models
      /upper-limb.glb
      /lower-limb.glb

  /docs
    /ANIMEJS_V4_MIGRATION.md
    /MAX_GRAPHICS_IMPLEMENTATION.md
    /XP_SYSTEM_GUIDE.md
    /COMPONENT_USAGE_GUIDE.md
    /ARCHITECTURE_ROADMAP.md

  /scripts
    /migrate-anime-v4.mjs
```

---

## Data Models

### localStorage Keys

```typescript
'studyin-xp-progress'        // UserProgress
'studyin-topic-progress'     // Record<string, TopicProgress>
'studyin-achievements'       // string[] (achievement IDs)
'studyin-session-history'    // SessionData[]
'studyin-srs-cards'          // CardReview[]
'studyin-sync-queue'         // SyncQueueItem[]
'studyin-settings'           // UserSettings
```

### UserSettings

```typescript
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  volume: number; // 0-100
  notificationsEnabled: boolean;
  autoAdvance: boolean;
  questionTimer: boolean;
}
```

---

## State Management Strategy

### Current Approach: React Context + localStorage

**Pros**:
- Simple, no external deps
- Works for current scope
- Fast to implement

**When to Consider Redux/Zustand**:
- More than 5 contexts
- Complex state updates
- Time-travel debugging needed
- State sharing across many components

**Recommendation**: Stick with Context until you hit pain points.

---

## Performance Targets

### Page Load
- **Target**: < 2s on 3G
- **Strategies**: Code splitting, lazy loading, image optimization

### Animation FPS
- **Target**: 60 FPS
- **Strategies**: GPU acceleration, requestAnimationFrame, will-change

### Bundle Size
- **Target**: < 300KB gzipped
- **Strategies**: Tree shaking, dynamic imports, CDN for heavy libs

---

## Testing Strategy

### Unit Tests (Jest)
- XP calculation logic
- Achievement conditions
- Pattern detection algorithms

### Integration Tests (Playwright)
- XP flow (answer → toast → level up)
- Achievement unlocking
- Session tracking

### E2E Tests
- Complete study session
- Analytics accuracy
- Offline sync

---

## Deployment Checklist

- [ ] Run `npm run build` successfully
- [ ] All tests passing
- [ ] Performance audit with Lighthouse (>90 score)
- [ ] Bundle size analysis
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (PostHog, Plausible)
- [ ] SEO meta tags
- [ ] Social media cards (OG images)
- [ ] Service worker registered
- [ ] PWA manifest valid
- [ ] Accessibility audit (even though not priority)

---

## Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Sprint 1** | 1 week | Easy tasks (E1-E6) |
| **Sprint 2** | 1 week | Gamification (M1-M2, E5) |
| **Sprint 3** | 1 week | Analytics (M3-M6) |
| **Sprint 4** | 1 week | Advanced (H1, H3, H5) |
| **Sprint 5** | 2 weeks | Polish (H2, H4, optimization) |
| **Total** | **6 weeks** | Full implementation |

**Fast Track**: Focus on Sprints 1-2 only = 2 weeks for core gamification

---

## Success Metrics

### User Engagement
- Daily active users
- Average session time
- Streak retention (% maintaining >7 days)

### Learning Outcomes
- Average accuracy improvement over time
- Topics mastered per user
- Spaced repetition adherence

### Technical
- Page load time < 2s
- Animation FPS > 55
- Error rate < 1%

---

## Resources Needed

### Audio Assets
- XP gain sound (100-200ms, uplifting)
- Level up sound (1-2s, celebratory)
- Achievement sound (500ms, triumphant)

**Sources**:
- Freesound.org
- Zapsplat.com
- Custom with GarageBand

### 3D Models
- Upper limb anatomy (.glb format)
- Lower limb anatomy
- Organ systems

**Sources**:
- Sketchfab
- TurboSquid
- NIH 3D Print Exchange

### Fonts
- Currently using system fonts
- Consider custom font for branding

---

## Next Steps

**I recommend starting with Sprint 1 (Week 1 - Foundation)**:

1. ✅ Test current MAX GRAPHICS system
2. 🎯 **E1: Connect XP to questions** (most impact)
3. 📚 E2: Connect XP to lessons
4. 🏠 E3: Update landing page
5. 🔥 E4: Daily streak tracker
6. 📊 E6: Topic progress tracking

This will give you a fully functional XP system integrated with real study actions, which is the foundation for everything else.

**Want me to start implementing E1 (Connect XP to Questions)?**
