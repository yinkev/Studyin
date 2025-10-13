/**
 * CosmicDashboard - Space-themed Medical Education Dashboard
 * NO GRADIENTS - solid colors with glassmorphism and glow effects
 * Based on three reference designs with medical education context
 */

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  BookOpen,
  Brain,
  Clock,
  Target,
  Trophy,
  Star,
  Zap,
  Heart,
  Activity
} from 'lucide-react';

import type { View } from '@/components/NavBar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  CosmicSidebar,
  CosmicLevelCard,
  SkillMasteryRings,
  CircularProgress,
  AchievementGrid,
  QuestList,
  MilestoneTracker,
  CompactLeaderboard,
  CelebrationModal,
  type Achievement,
  type Quest,
  type Milestone,
  type LeaderboardUser
} from '@/components/dashboard';

import { getDashboardData, transformWeakTopicsToSkills, transformKnowledgeGapsToQuests, type DashboardData } from '@/lib/api/dashboard';
import { DigestPanel } from '@/components/dashboard/DigestPanel';
import { apiClient } from '@/lib/api/client';

interface GamificationSnapshot {
  level: number;
  currentXP: number;
  targetXP: number;
  streak: number;
  bestStreak?: number;
  lastCheckIn?: string | null;
  masteryPercent?: number;
  goalMinutes?: number;
}

interface CosmicDashboardProps {
  onNavigate: (view: View) => void;
  stats: GamificationSnapshot;
  currentView: View;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

// Default fallback data in case API fails
const DEFAULT_SKILLS = [
  { name: 'Loading...', mastery: 0, color: 'primary' as const }
];

const DEFAULT_QUESTS: Quest[] = [];
const DEFAULT_ACHIEVEMENTS: Achievement[] = [];
const DEFAULT_MILESTONES: Milestone[] = [];
const DEFAULT_LEADERBOARD: LeaderboardUser[] = [];

export function CosmicDashboard({ onNavigate, stats, currentView }: CosmicDashboardProps) {
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Fetch dashboard data on mount
  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);

        // Fetch materials count
        try {
          const materialsResponse = await apiClient.get('/api/materials/');
          setTotalMaterials(materialsResponse.data.length || 0);
        } catch (e) {
          console.warn('Failed to fetch materials count:', e);
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const handleAchievementClick = (achievement: Achievement) => {
    if (achievement.unlocked) {
      setCelebrationAchievement(achievement);
      setCelebrationOpen(true);
    }
  };

  const handleQuestToggle = (questId: string) => {
    console.log('Toggle quest:', questId);
    // Quest completion would be handled by backend API
  };

  // Transform real data to component format
  const skills = dashboardData ? transformWeakTopicsToSkills(dashboardData.weak_topics) : DEFAULT_SKILLS;
  const quests = dashboardData ? transformKnowledgeGapsToQuests(dashboardData.knowledge_gaps) : DEFAULT_QUESTS;

  // Use real data from dashboard
  const overview = dashboardData?.overview;
  const studyMinutes = overview?.study_minutes_30d || 0;
  const studyTime = `${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`;
  const totalTopics = (overview?.topics_mastered || 0) + (overview?.topics_weak || 0);

  // For now, show empty arrays for achievements/milestones/leaderboard
  // These would need dedicated backend endpoints
  const achievements = DEFAULT_ACHIEVEMENTS;
  const milestones = DEFAULT_MILESTONES;
  const leaderboard = DEFAULT_LEADERBOARD;

  return (
    <div className="min-h-screen bg-background">
      {/* Cosmic background effects - NO GRADIENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        <motion.div
          className="absolute bottom-40 left-40 w-80 h-80 rounded-full bg-secondary/5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-accent/5 blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>

      {/* Sidebar */}
      <CosmicSidebar
        currentView={currentView}
        onNavigate={onNavigate}
        userLevel={stats.level}
        userXP={stats.currentXP}
        userName="Medical Student"
      />

      {/* Main content */}
      <main className="ml-20 lg:ml-64 p-4 lg:p-8 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1920px] mx-auto space-y-6"
        >
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass border p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rapid Practice</p>
                <h3 className="text-lg font-semibold">Quick 5 MCQs</h3>
              </div>
              <button className="bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold" onClick={() => onNavigate('quiz')}>
                Start
              </button>
            </div>
            <div className="glass border p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">First Pass</p>
                <h3 className="text-lg font-semibold">Guided Teaching</h3>
              </div>
              <button className="border rounded-full px-4 py-2 text-sm font-semibold" onClick={() => onNavigate('firstpass' as any)}>
                Begin
              </button>
            </div>
            <div className="glass border p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Digest</p>
                <h3 className="text-lg font-semibold">1‑Minute Read</h3>
              </div>
              <button className="border rounded-full px-4 py-2 text-sm font-semibold" onClick={() => onNavigate('analytics')}>
                View
              </button>
            </div>
          </div>

          {/* Daily Digest */}
          <DigestPanel />
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-foreground mb-2">
                Welcome Back, Explorer
              </h1>
              <p className="text-muted-foreground">
                Continue your medical mastery journey
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-stardust/20 text-stardust border-stardust/30"
            >
              Streak: {stats.streak} days
            </Badge>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 lg:gap-6">
            {/* Large Level Card */}
            <motion.div variants={itemVariants} className="xl:col-span-4">
              <CosmicLevelCard
                level={stats.level}
                currentXP={stats.currentXP}
                targetXP={stats.targetXP}
                masteryPercent={stats.masteryPercent ?? 0}
              />
            </motion.div>

            {/* Stats Grid */}
            <motion.div variants={itemVariants} className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={<Brain className="w-5 h-5" />}
                label="Topics"
                value={loading ? '...' : totalTopics.toString()}
                color="primary"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Study Time"
                value={loading ? '...' : studyTime}
                color="secondary"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Questions"
                value={loading ? '...' : (overview?.sessions_30d || 0).toString()}
                color="accent"
              />
              <StatCard
                icon={<Trophy className="w-5 h-5" />}
                label="Materials"
                value={loading ? '...' : totalMaterials.toString()}
                color="aurora"
              />
            </motion.div>

            {/* Skill Mastery Rings */}
            <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-8">
              {loading ? (
                <div className="glass p-6 rounded-xl h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading skills...</p>
                </div>
              ) : skills.length > 0 ? (
                <SkillMasteryRings skills={skills} />
              ) : (
                <div className="glass p-6 rounded-xl h-full">
                  <p className="text-muted-foreground text-center">
                    Start studying to track your skill mastery
                  </p>
                </div>
              )}
            </motion.div>

            {/* Leaderboard */}
            <motion.div variants={itemVariants} className="xl:col-span-4">
              {loading ? (
                <div className="glass p-6 rounded-xl h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              ) : leaderboard.length > 0 ? (
                <CompactLeaderboard users={leaderboard} currentUserId="you" />
              ) : (
                <div className="glass p-6 rounded-xl h-full">
                  <p className="text-muted-foreground text-center">
                    Leaderboard coming soon
                  </p>
                </div>
              )}
            </motion.div>

            {/* Tabs Section */}
            <motion.div variants={itemVariants} className="md:col-span-2 xl:col-span-12">
              <Tabs defaultValue="quests" className="w-full">
                <TabsList className="glass w-full justify-start">
                  <TabsTrigger value="quests">Knowledge Gaps</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="milestones">Journey</TabsTrigger>
                </TabsList>

                <TabsContent value="quests" className="mt-6">
                  {loading ? (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">Loading knowledge gaps...</p>
                    </div>
                  ) : quests.length > 0 ? (
                    <QuestList quests={quests} onToggleQuest={handleQuestToggle} />
                  ) : (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">
                        No knowledge gaps detected. Keep studying to maintain your mastery!
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="achievements" className="mt-6">
                  {loading ? (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">Loading achievements...</p>
                    </div>
                  ) : achievements.length > 0 ? (
                    <AchievementGrid
                      achievements={achievements}
                      onAchievementClick={handleAchievementClick}
                    />
                  ) : (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">
                        Achievements system coming soon
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="milestones" className="mt-6">
                  {loading ? (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">Loading milestones...</p>
                    </div>
                  ) : milestones.length > 0 ? (
                    <MilestoneTracker milestones={milestones} />
                  ) : (
                    <div className="glass p-6 rounded-xl">
                      <p className="text-muted-foreground">
                        Learning journey milestones coming soon
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Celebration Modal */}
      <CelebrationModal
        achievement={celebrationAchievement}
        open={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'primary' | 'secondary' | 'accent' | 'aurora';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/20',
    secondary: 'text-secondary bg-secondary/20',
    accent: 'text-accent bg-accent/20',
    aurora: 'text-aurora bg-aurora/20'
  };

  return (
    <div className="glass p-4 rounded-xl">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
