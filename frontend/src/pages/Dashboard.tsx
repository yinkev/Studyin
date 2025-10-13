import { useEffect, useMemo, useState, type SVGProps } from 'react';
import DOMPurify from 'dompurify';
import { ArrowRight, BookOpen, Sparkles, Target, Trophy } from 'lucide-react';

import type { View } from '@/components/NavBar';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { XPBar } from '@/components/gamification/XPBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { trackMaterialView } from '@/lib/analytics/tracker';

interface Material {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
  created_at: string;
  chunk_count: number;
}

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

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export function Dashboard({ onNavigate, stats }: DashboardProps) {
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
        setError('We could not load your materials. Please try again soon.');
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value < 10 && index > 0 ? 1 : 0)} ${units[index]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.valueOf())) {
      return 'Unknown';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalChunks = materials.reduce((sum, material) => sum + (material.chunk_count ?? 0), 0);
  const totalSize = materials.reduce((sum, material) => sum + material.file_size, 0);
  const xpProgress = Math.min(stats.currentXP / Math.max(stats.targetXP, 1), 1);
  const dailyMinutesLogged = Math.round((stats.goalMinutes ?? 45) * xpProgress);

  const achievements = useMemo<Achievement[]>(() => {
    return [
      {
        id: 'spaced-recall',
        title: 'Spaced Recall',
        description: 'Review materials on 3 separate days',
        unlocked: stats.streak >= 3,
      },
      {
        id: 'mindful-minute',
        title: 'Mindful Minute',
        description: 'Log 30 focused minutes in one day',
        unlocked: dailyMinutesLogged >= 30,
      },
      {
        id: 'chunk-master',
        title: 'Chunk Master',
        description: 'Process 100 knowledge chunks',
        unlocked: totalChunks >= 100,
      },
    ];
  }, [stats.streak, dailyMinutesLogged, totalChunks]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
      <header className="soft-card pixel-border bg-gradient-to-br from-white/90 via-white/70 to-primary/10 px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="badge-soft text-[0.65rem] font-semibold tracking-[0.18em] text-primary-foreground">
            Welcome back
          </span>
          <span className="font-pixel text-[0.55rem] tracking-[0.3em] text-muted-foreground">
            GENTLE · PROGRESS
          </span>
        </div>
        <h1 className="mt-6 text-brutalist text-foreground">Focus on Gentle Mastery</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Today’s plan leans on cognitive science—soft encouragement, spaced review, and playful feedback to build
          lasting medical expertise.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" className="shadow-soft-button" onClick={() => onNavigate('upload')}>
            <BookOpen className="size-4" aria-hidden="true" />
            Upload new material
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="shadow-soft-button"
            onClick={() => onNavigate('chat')}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Open AI coach
          </Button>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <XPBar
          level={stats.level}
          currentXP={stats.currentXP}
          targetXP={stats.targetXP}
          label="Earn XP through focused study bursts"
          className="px-6 py-6"
        />
        <StreakCounter
          streak={stats.streak}
          bestStreak={stats.bestStreak}
          lastCheckIn={stats.lastCheckIn}
          goalMinutes={stats.goalMinutes}
          className="px-6 py-6"
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <span className="kawaii-icon" aria-hidden="true">
            📚
          </span>
          <div>
            <p className="text-brutalist text-base text-foreground">Study Materials</p>
            <p className="mt-1 text-2xl font-semibold text-primary">{materials.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Balanced library beats binge-learning.</p>
          </div>
        </div>
        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <span className="kawaii-icon" aria-hidden="true">
            🧠
          </span>
          <div>
            <p className="text-brutalist text-base text-foreground">Knowledge Chunks</p>
            <p className="mt-1 text-2xl font-semibold text-secondary">{totalChunks}</p>
            <p className="mt-1 text-xs text-muted-foreground">Chunking improves retention. Keep indexing.</p>
          </div>
        </div>
        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <span className="kawaii-icon" aria-hidden="true">
            💾
          </span>
          <div>
            <p className="text-brutalist text-base text-foreground">Total Content</p>
            <p className="mt-1 text-2xl font-semibold text-accent">{formatFileSize(totalSize)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Aim for digestible file sizes per study block.</p>
          </div>
        </div>
        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <span className="kawaii-icon" aria-hidden="true">
            🎯
          </span>
          <div>
            <p className="text-brutalist text-base text-foreground">Daily Focus</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {dailyMinutesLogged} / {stats.goalMinutes ?? 45} min
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gentle reminder: micro-sessions beat cramming for long-term recall.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <LevelBadge
          level={stats.level}
          masteryPercent={stats.masteryPercent ?? xpProgress * 100}
          title="Resident"
          className="px-6 py-6"
        />

        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="kawaii-icon size-12 text-xl" aria-hidden="true">
                🌈
              </span>
              <p className="text-brutalist text-base text-foreground">Daily Goal</p>
            </div>
            <Target className="size-5 text-accent-foreground" aria-hidden="true" />
          </div>
          <p className="text-sm text-muted-foreground">
            You’re {Math.round(xpProgress * 100)}% toward today’s flow target. Short breaks keep momentum without
            fatigue.
          </p>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full bg-gradient-to-r from-accent via-primary to-secondary transition-all duration-500 ease-soft-bounce"
              style={{ width: `${Math.round(xpProgress * 100)}%` }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="soft-card pixel-border flex flex-col gap-4 px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-brutalist text-base text-foreground">Achievements</p>
            <Trophy className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center justify-between rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-soft-button"
                aria-live="polite"
              >
                <div>
                  <p className="font-semibold text-foreground">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <span
                  className={`font-pixel text-[0.6rem] tracking-[0.18em] ${
                    achievement.unlocked ? 'text-primary' : 'text-muted-foreground opacity-60'
                  }`}
                >
                  {achievement.unlocked ? 'UNLOCKED' : 'SOON'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="soft-card pixel-border px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-brutalist text-xl text-foreground">Your Study Materials</h2>
          <Button variant="ghost" className="gap-2 text-sm font-semibold" onClick={() => onNavigate('upload')}>
            Manage library
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading materials...</p>}

        {error && (
          <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {!loading && !error && materials.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-6 text-center">
            <div className="empty-state-illustration" aria-hidden="true" />
            <div className="max-w-md space-y-3">
              <p className="text-lg font-semibold text-foreground">Your library is ready for its first upload!</p>
              <p className="text-sm text-muted-foreground">
                Start with one concise resource. Small, consistent additions make the AI coach smarter without
                overwhelming you.
              </p>
            </div>
            <Button size="lg" className="shadow-soft-button" onClick={() => onNavigate('upload')}>
              <UploadIcon aria-hidden="true" />
              Upload study material
            </Button>
          </div>
        )}

        {!loading && !error && materials.length > 0 && (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {materials.map((material) => (
              <li
                key={material.id}
                className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 px-5 py-6 shadow-soft transition-transform duration-300 ease-soft-bounce hover:-translate-y-1 hover:shadow-elevated cursor-pointer"
                onClick={() => trackMaterialView(material.id, material.filename)}
              >
                <div className="absolute -right-3 -top-3 h-16 w-16 rotate-12 rounded-xl bg-primary/15 blur-2xl" />
                <div className="flex items-start gap-4">
                  <span className="kawaii-icon size-12 text-xl" aria-hidden="true">
                    📄
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {DOMPurify.sanitize(material.filename, { ALLOWED_TAGS: [] })}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                      <span>{formatFileSize(material.file_size)}</span>
                      <span>•</span>
                      <span>{material.chunk_count ?? 0} chunks</span>
                      <span>•</span>
                      <span>{formatDate(material.created_at)}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function UploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      {...props}
    >
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M20 20H4" />
    </svg>
  );
}

export default Dashboard;
