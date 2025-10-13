import type { LearningOverview as LearningOverviewData } from '@/hooks/useAnalytics';
import { BookOpen, Target, CheckCircle, TrendingUp, Brain, Sparkles } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface LearningOverviewProps {
  data: LearningOverviewData;
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: 'primary' | 'secondary' | 'accent' | 'foreground';
}

// ============================================================================
// Metric Card Component
// ============================================================================

function MetricCard({ icon, emoji, title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    foreground: 'text-foreground',
  };

  return (
    <div className="soft-card pixel-border group relative overflow-hidden px-6 py-6 transition-transform duration-300 ease-soft-bounce hover:-translate-y-1">
      {/* Gradient glow effect */}
      <div className={`absolute -right-4 -top-4 h-20 w-20 rotate-12 rounded-xl ${color === 'primary' ? 'bg-primary/15' : color === 'secondary' ? 'bg-secondary/15' : color === 'accent' ? 'bg-accent/15' : 'bg-foreground/10'} blur-2xl`} />

      <div className="relative">
        <div className="flex items-start justify-between">
          <span className="kawaii-icon text-3xl" aria-hidden="true">
            {emoji}
          </span>
          <div className={`rounded-xl bg-white/80 p-2 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-brutalist text-sm text-muted-foreground">{title}</p>
          <p className={`mt-2 text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function LearningOverview({ data, className = '' }: LearningOverviewProps) {
  // Format values from backend data
  const totalHours = data.total_duration_hours;
  const timeDisplay = totalHours >= 1
    ? `${totalHours.toFixed(1)}h`
    : `${Math.round(totalHours * 60)}m`;

  const avgSessionDisplay = data.avg_session_duration_minutes >= 60
    ? `${Math.floor(data.avg_session_duration_minutes / 60)}h ${Math.round(data.avg_session_duration_minutes % 60)}m`
    : `${Math.round(data.avg_session_duration_minutes)}m`;

  const completionRateDisplay = `${Math.round(data.completion_rate)}%`;

  return (
    <div className={className}>
      <div className="soft-card pixel-border mb-6 bg-gradient-to-br from-white/90 via-white/70 to-primary/10 px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="kawaii-icon text-3xl" aria-hidden="true">
                🎓
              </span>
              <div>
                <h2 className="text-brutalist text-2xl text-foreground">Learning Overview</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your progress over the last 30 days
                </p>
              </div>
            </div>
          </div>
          <span className="badge-soft text-[0.65rem] font-semibold tracking-[0.18em] text-primary-foreground">
            30-DAY SNAPSHOT
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={<BookOpen className="size-5" />}
          emoji="📚"
          title="Study Sessions"
          value={data.total_sessions}
          subtitle={`Avg ${avgSessionDisplay} per session`}
          color="primary"
        />

        <MetricCard
          icon={<TrendingUp className="size-5" />}
          emoji="⏱️"
          title="Total Study Time"
          value={timeDisplay}
          subtitle="Building lasting expertise"
          color="secondary"
        />

        <MetricCard
          icon={<Target className="size-5" />}
          emoji="🎯"
          title="XP Earned"
          value={data.total_xp_earned}
          subtitle={`Level ${data.current_level} • ${data.current_streak} day streak`}
          color="accent"
        />

        <MetricCard
          icon={<CheckCircle className="size-5" />}
          emoji="✅"
          title="Completion Rate"
          value={completionRateDisplay}
          subtitle="Materials completed vs viewed"
          color="primary"
        />

        <MetricCard
          icon={<Brain className="size-5" />}
          emoji="🧠"
          title="Materials Viewed"
          value={data.materials_viewed}
          subtitle={`${data.materials_completed} completed`}
          color="secondary"
        />

        <MetricCard
          icon={<Sparkles className="size-5" />}
          emoji="✨"
          title="Active Days"
          value={data.daily_active_days}
          subtitle="Consistency builds mastery"
          color="accent"
        />
      </div>

      {/* Insights Section */}
      <div className="soft-card pixel-border mt-6 px-8 py-6">
        <div className="flex items-start gap-4">
          <span className="kawaii-icon text-3xl" aria-hidden="true">
            💡
          </span>
          <div className="flex-1">
            <h3 className="text-brutalist text-lg text-foreground">Learning Insights</h3>
            <div className="mt-4 space-y-3">
              {data.total_sessions > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                  <span className="text-primary">•</span>
                  <p className="text-sm text-foreground">
                    You've completed <strong>{data.total_sessions}</strong> study sessions.
                    {data.avg_session_duration_minutes >= 25 && data.avg_session_duration_minutes <= 50 ? (
                      <span className="text-accent"> Your session length is optimal for retention! 🎉</span>
                    ) : data.avg_session_duration_minutes < 25 ? (
                      <span className="text-muted-foreground"> Consider slightly longer sessions (25-50 min) for better retention.</span>
                    ) : (
                      <span className="text-muted-foreground"> Try breaking long sessions into 25-50 min blocks with breaks.</span>
                    )}
                  </p>
                </div>
              )}

              {data.completion_rate > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                  <span className="text-secondary">•</span>
                  <p className="text-sm text-foreground">
                    Your completion rate is <strong>{Math.round(data.completion_rate)}%</strong>.
                    {data.completion_rate >= 80 ? (
                      <span className="text-accent"> Excellent mastery! You're finishing what you start. 🏆</span>
                    ) : data.completion_rate >= 60 ? (
                      <span className="text-primary"> You're making good progress. Keep pushing!</span>
                    ) : (
                      <span className="text-muted-foreground"> Try to complete materials you view for better retention.</span>
                    )}
                  </p>
                </div>
              )}

              {data.current_streak > 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                  <span className="text-accent">•</span>
                  <p className="text-sm text-foreground">
                    You're on a <strong>{data.current_streak}-day streak</strong>!
                    {data.current_streak >= data.longest_streak ? (
                      <span className="text-primary"> That's your best yet! 🔥</span>
                    ) : (
                      <span className="text-muted-foreground"> Your longest streak is {data.longest_streak} days.</span>
                    )}
                  </p>
                </div>
              )}

              {data.total_sessions === 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                  <span className="text-muted-foreground">•</span>
                  <p className="text-sm text-muted-foreground">
                    Start your first study session to see personalized insights here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
