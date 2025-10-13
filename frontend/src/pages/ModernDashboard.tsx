/**
 * ModernDashboard 2025
 * World-class UI/UX with:
 * - NO GRADIENTS (per user request)
 * - Bento grid asymmetric layout
 * - Psychology-driven gamification (flow state, autonomy, intrinsic motivation)
 * - Glassmorphism for depth
 * - Advanced micro-interactions
 * - Modular component architecture
 */

import { useEffect, useState, useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  BookOpen,
  Sparkles,
  Brain,
  Clock,
  ArrowRight,
  BarChart3
} from 'lucide-react';

import type { View } from '@/components/NavBar';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Modular dashboard components
import {
  ModernXPBar,
  ModernStreakCard,
  LevelCard,
  FlowStateCard,
  StatsCard,
  MaterialsGrid,
  type Material,
  type FlowState
} from '@/components/dashboard';

import { LoadingState, ErrorState, EmptyState } from '@/components/dashboard/DashboardStates';
import { InsightsPanel } from '@/components/dashboard/InsightsPanel';

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

interface DashboardProps {
  onNavigate: (view: View) => void;
  stats: GamificationSnapshot;
}

// Animation variants - NO GRADIENTS
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const bentoCellVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export function ModernDashboard({ onNavigate, stats }: DashboardProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const response = await apiClient.get<Material[]>('/api/materials/');
        setMaterials(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch materials:', err);
        setError('Could not load materials. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, []);

  const xpProgress = Math.min(stats.currentXP / Math.max(stats.targetXP, 1), 1);
  const totalChunks = materials.reduce((sum, m) => sum + (m.chunk_count ?? 0), 0);
  const dailyMinutes = Math.round((stats.goalMinutes ?? 45) * xpProgress);

  // Psychology: Flow State calculation (skill vs challenge)
  const flowState = useMemo<FlowState>(() => {
    const skill = Math.min(stats.level * 10, 100);
    const challenge = Math.min(((totalChunks / 10) * (stats.masteryPercent ?? 50)), 100);
    const balance = 100 - Math.abs(skill - challenge);

    let state: 'anxiety' | 'boredom' | 'flow' | 'apathy' = 'apathy';
    if (balance > 70) state = 'flow';
    else if (challenge > skill + 20) state = 'anxiety';
    else if (skill > challenge + 20) state = 'boredom';

    return { skill, challenge, balance, state };
  }, [stats.level, totalChunks, stats.masteryPercent]);

  return (
    <motion.div
      className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Bento Grid Layout - Asymmetric, Content-Focused */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6">

        {/* HERO SECTION - Spans full width on mobile, 2/3 on desktop */}
        <motion.div
          variants={bentoCellVariants}
          className="sm:col-span-2 md:col-span-6 lg:col-span-8"
        >
          <Card className="glass border-2 border-primary/20 overflow-hidden h-full">
            <CardContent className="p-6 lg:p-8 relative">
              {/* NO GRADIENT - Solid color accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-semibold tracking-wide">
                    Welcome Back
                  </Badge>
                  <Badge variant="outline" className="text-xs tracking-wide">
                    {flowState.state.toUpperCase()} STATE
                  </Badge>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary">
                  Master Medicine,<br />
                  <span className="text-foreground">One Concept at a Time</span>
                </h1>

                <p className="max-w-2xl text-muted-foreground text-sm sm:text-base">
                  Build lasting expertise through spaced repetition, active recall, and psychology-driven learning.
                  Your brain learns best with gentle, consistent progress.
                </p>

                <div className="flex flex-wrap gap-3 mt-2">
                  <Button
                    size="lg"
                    className="group elevation-2 hover:elevation-3 transition-all"
                    onClick={() => onNavigate('upload')}
                  >
                    <BookOpen className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Add Material
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group elevation-2 hover:elevation-3 transition-all"
                    onClick={() => onNavigate('chat')}
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    AI Coach
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="group"
                    onClick={() => onNavigate('analytics')}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* LEVEL BADGE - Compact, top-right on desktop */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-3 lg:col-span-4"
        >
          <LevelCard level={stats.level} masteryPercent={stats.masteryPercent ?? 0} className="glass" />
        </motion.div>

        {/* XP PROGRESS - Full width section */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-6 lg:col-span-7"
        >
          <ModernXPBar
            currentXP={stats.currentXP}
            targetXP={stats.targetXP}
            level={stats.level}
            className="glass"
          />
        </motion.div>

        {/* STREAK COUNTER */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-3 lg:col-span-5"
        >
          <ModernStreakCard
            streak={stats.streak}
            bestStreak={stats.bestStreak ?? stats.streak}
            lastCheckIn={stats.lastCheckIn}
          />
        </motion.div>

        {/* FLOW STATE INDICATOR - Psychology-driven feature */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-3 lg:col-span-4"
        >
          <FlowStateCard flowState={flowState} />
        </motion.div>

        {/* STATS GRID */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-3 lg:col-span-4"
        >
          <StatsCard
            icon={<Brain className="w-6 h-6" />}
            label="Knowledge Chunks"
            value={totalChunks}
            subtitle="Spaced repetition units"
            color="text-primary"
          />
        </motion.div>

        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-3 lg:col-span-4"
        >
          <StatsCard
            icon={<Clock className="w-6 h-6" />}
            label="Focus Today"
            value={`${dailyMinutes}min`}
            subtitle={`Goal: ${stats.goalMinutes ?? 45}min`}
            color="text-secondary"
          />
        </motion.div>

        {/* MATERIALS LIST - Full width */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-6 lg:col-span-12"
        >
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Study Library</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {materials.length} materials • {totalChunks} learning units
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="gap-2 group"
                  onClick={() => onNavigate('upload')}
                >
                  Manage
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {loading && <LoadingState />}
              {error && <ErrorState message={error} />}
              {!loading && !error && materials.length === 0 && <EmptyState onNavigate={onNavigate} />}
              {!loading && !error && materials.length > 0 && (
                <MaterialsGrid materials={materials} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* INSIGHTS PANEL */}
        <motion.div
          variants={bentoCellVariants}
          className="md:col-span-6 lg:col-span-12"
        >
          <InsightsPanel />
        </motion.div>
      </div>
    </motion.div>
  );
}
