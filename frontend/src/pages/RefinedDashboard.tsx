/**
 * RefinedDashboard - Professional Medical Education Dashboard
 *
 * Design Principles:
 * - Clean, focused hierarchy
 * - Purposeful use of color and effects
 * - Professional medical aesthetic
 * - Content-first approach
 * - Accessibility built-in
 * - NO GRADIENTS
 */

import { useState, useEffect } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  BookOpen,
  Brain,
  Clock,
  Target,
  TrendingUp,
  Zap,
  Award,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import type { View } from '@/components/NavBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  RefinedSidebar,
  LevelProgress,
  SkillGrid,
  ActivityCalendar,
  QuickStats,
  KnowledgeGapsList,
  type Skill,
  type Quest
} from '@/components/dashboard/refined';

import { getDashboardData, transformWeakTopicsToSkills, transformKnowledgeGapsToQuests, type DashboardData } from '@/lib/api/dashboard';
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

interface RefinedDashboardProps {
  onNavigate: (view: View) => void;
  stats: GamificationSnapshot;
  currentView: View;
}

// Smooth, professional animations
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08
    }
  }
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 18
    }
  }
};

export function RefinedDashboard({ onNavigate, stats, currentView }: RefinedDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMaterials, setTotalMaterials] = useState(0);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
        setError(null);

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

  // Transform data
  const skills = dashboardData ? transformWeakTopicsToSkills(dashboardData.weak_topics) : [];
  const knowledgeGaps = dashboardData ? transformKnowledgeGapsToQuests(dashboardData.knowledge_gaps) : [];
  const overview = dashboardData?.overview;

  const studyMinutes = overview?.study_minutes_30d || 0;
  const totalTopics = (overview?.topics_mastered || 0) + (overview?.topics_weak || 0);
  const masteredTopics = overview?.topics_mastered || 0;
  const sessions = overview?.sessions_30d || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle ambient background - NO GRADIENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div
          className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/6 blur-[100px]"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Sidebar */}
      <RefinedSidebar
        currentView={currentView}
        onNavigate={onNavigate}
        userLevel={stats.level}
        userXP={stats.currentXP}
        userName="Medical Student"
      />

      {/* Main content */}
      <main className="ml-20 lg:ml-72 p-6 lg:p-8 xl:p-10 relative">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1600px] mx-auto space-y-8"
        >
          {/* Header Section */}
          <motion.div variants={cardVariants}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2 tracking-tight">
                  Welcome back
                </h1>
                <p className="text-muted-foreground text-base">
                  Continue building your medical expertise
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-2 text-sm border-border">
                  <Calendar className="w-4 h-4 mr-2" />
                  {stats.streak} day streak
                </Badge>
                <Button
                  size="lg"
                  className="btn-accent"
                  onClick={() => onNavigate('chat')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Key Metrics - Elevated Card */}
          <motion.div variants={cardVariants}>
            <Card className="card-featured">
              <CardContent className="p-6 lg:p-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <QuickStat
                    icon={<Brain className="w-5 h-5" />}
                    label="Topics Mastered"
                    value={masteredTopics.toString()}
                    total={totalTopics}
                    color="primary"
                  />
                  <QuickStat
                    icon={<Clock className="w-5 h-5" />}
                    label="Study Time (30d)"
                    value={`${Math.floor(studyMinutes / 60)}h`}
                    subtitle={`${studyMinutes % 60}m`}
                    color="accent"
                  />
                  <QuickStat
                    icon={<Target className="w-5 h-5" />}
                    label="Study Sessions"
                    value={sessions.toString()}
                    subtitle="Last 30 days"
                    color="success"
                  />
                  <QuickStat
                    icon={<BookOpen className="w-5 h-5" />}
                    label="Materials"
                    value={totalMaterials.toString()}
                    subtitle="Available"
                    color="primary"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Progress */}
            <div className="lg:col-span-2 space-y-6">
              {/* Level Progress */}
              <motion.div variants={cardVariants}>
                <Card className="surface-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-primary" />
                      Your Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LevelProgress
                      level={stats.level}
                      currentXP={stats.currentXP}
                      targetXP={stats.targetXP}
                      masteryPercent={stats.masteryPercent ?? 0}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Skill Mastery */}
              <motion.div variants={cardVariants}>
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-accent" />
                      Topic Mastery
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : skills.length > 0 ? (
                      <SkillGrid skills={skills} />
                    ) : (
                      <EmptySkills onNavigate={onNavigate} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Knowledge Gaps */}
              <motion.div variants={cardVariants}>
                <Tabs defaultValue="gaps" className="w-full">
                  <Card className="surface">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <TabsList className="bg-background/50 border border-border-subtle">
                          <TabsTrigger value="gaps" className="text-sm">
                            Knowledge Gaps
                          </TabsTrigger>
                          <TabsTrigger value="activity" className="text-sm">
                            Recent Activity
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <TabsContent value="gaps" className="mt-0">
                        {loading ? (
                          <LoadingState />
                        ) : knowledgeGaps.length > 0 ? (
                          <KnowledgeGapsList gaps={knowledgeGaps} />
                        ) : (
                          <EmptyGaps />
                        )}
                      </TabsContent>

                      <TabsContent value="activity" className="mt-0">
                        <ActivityCalendar streak={stats.streak} />
                      </TabsContent>
                    </CardContent>
                  </Card>
                </Tabs>
              </motion.div>
            </div>

            {/* Right Column - Quick Actions & Insights */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <motion.div variants={cardVariants}>
                <Card className="surface">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ActionButton
                      icon={<BookOpen className="w-4 h-4" />}
                      label="Add Material"
                      description="Upload new study content"
                      onClick={() => onNavigate('upload')}
                    />
                    <ActionButton
                      icon={<Brain className="w-4 h-4" />}
                      label="AI Coach"
                      description="Get personalized help"
                      onClick={() => onNavigate('chat')}
                      variant="accent"
                    />
                    <ActionButton
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="View Analytics"
                      description="Track your progress"
                      onClick={() => onNavigate('analytics')}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Learning Tips */}
              <motion.div variants={cardVariants}>
                <Card className="surface border-accent/30">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base mb-1">Today's Tip</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Spaced repetition works best with consistent, short study sessions.
                          Aim for 20-30 minutes daily for optimal retention.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Study Streak Insight */}
              {stats.streak >= 7 && (
                <motion.div variants={cardVariants}>
                  <Card className="surface border-success/30">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base mb-1 text-success">
                            Great Streak!
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            You've studied for {stats.streak} consecutive days.
                            Consistency is key to long-term retention.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

// Component: Quick Stat
function QuickStat({
  icon,
  label,
  value,
  total,
  subtitle,
  color = 'primary'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  total?: number;
  subtitle?: string;
  color?: 'primary' | 'accent' | 'success';
}) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-success bg-success/10'
  };

  return (
    <div className="space-y-3">
      <div className={`inline-flex p-2.5 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {total && (
            <p className="text-sm text-muted-foreground">/ {total}</p>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Component: Action Button
function ActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'default'
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'accent';
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-start gap-3 p-4 rounded-lg
        border transition-all duration-200
        ${variant === 'accent'
          ? 'border-accent/30 bg-accent/5 hover:bg-accent/10 hover:border-accent/50'
          : 'border-border-subtle bg-background/30 hover:bg-background/60 hover:border-border'
        }
      `}
    >
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center shrink-0
        ${variant === 'accent' ? 'bg-accent/20 text-accent' : 'bg-primary/10 text-primary'}
      `}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium text-sm text-foreground mb-0.5">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

// Empty States
function EmptySkills({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
        <Brain className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base mb-2">No Topics Yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
        Start studying to track your topic mastery and identify areas for improvement
      </p>
      <Button onClick={() => onNavigate('upload')} variant="outline">
        Add Study Material
      </Button>
    </div>
  );
}

function EmptyGaps() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-success" />
      </div>
      <h3 className="font-semibold text-base mb-2">No Knowledge Gaps</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Great work! Keep studying consistently to maintain your mastery
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="space-y-3 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}
