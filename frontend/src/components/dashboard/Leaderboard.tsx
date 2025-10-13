/**
 * Leaderboard - Community rankings with cosmic styling
 * NO GRADIENTS - solid colors with medals and glow effects
 */

import { motion } from 'motion/react';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  trend?: 'up' | 'down' | 'same'; // vs last week
}

interface LeaderboardProps {
  users: LeaderboardUser[];
  currentUserId?: string;
  title?: string;
  className?: string;
}

const rankStyles = {
  1: {
    icon: Trophy,
    color: 'text-stardust',
    bg: 'bg-stardust/20',
    glow: 'glow-stardust',
    medal: '🥇'
  },
  2: {
    icon: Medal,
    color: 'text-neutral-400',
    bg: 'bg-neutral-400/20',
    glow: '',
    medal: '🥈'
  },
  3: {
    icon: Award,
    color: 'text-aurora',
    bg: 'bg-aurora/20',
    glow: 'glow-aurora',
    medal: '🥉'
  }
};

export function Leaderboard({
  users,
  currentUserId,
  title = 'Community Leaderboard',
  className
}: LeaderboardProps) {
  return (
    <Card className={cn('glass', className)}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Trophy className="w-5 h-5 text-stardust" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((user, index) => (
          <LeaderboardRow
            key={user.id}
            user={user}
            isCurrentUser={user.id === currentUserId}
            index={index}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  user,
  isCurrentUser,
  index
}: {
  user: LeaderboardUser;
  isCurrentUser: boolean;
  index: number;
}) {
  const isTopThree = user.rank <= 3;
  const styles = isTopThree ? rankStyles[user.rank as 1 | 2 | 3] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, x: 4 }}
    >
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
          isTopThree && 'glass-purple',
          !isTopThree && 'glass',
          isCurrentUser && 'ring-2 ring-primary/50',
          styles?.glow
        )}
      >
        {/* Rank */}
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-full font-bold shrink-0',
            isTopThree ? styles!.bg : 'bg-background/30'
          )}
        >
          {isTopThree ? (
            <span className="text-lg">{styles!.medal}</span>
          ) : (
            <span className="text-sm text-muted-foreground">#{user.rank}</span>
          )}
        </div>

        {/* Avatar */}
        <Avatar className="w-10 h-10 shrink-0 ring-2 ring-background/50">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="bg-primary/20 text-primary">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              'font-semibold text-sm truncate',
              isCurrentUser && 'text-primary'
            )}>
              {user.name}
              {isCurrentUser && (
                <span className="text-xs text-muted-foreground ml-1">(You)</span>
              )}
            </h4>
            {user.trend && (
              <TrendingUp
                className={cn(
                  'w-3 h-3',
                  user.trend === 'up' && 'text-accent rotate-0',
                  user.trend === 'down' && 'text-destructive rotate-180',
                  user.trend === 'same' && 'text-muted-foreground rotate-90'
                )}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Level {user.level} • {user.xp.toLocaleString()} XP
          </p>
        </div>

        {/* XP Badge */}
        <Badge
          variant="outline"
          className={cn(
            'text-xs shrink-0',
            isTopThree && 'bg-stardust/20 text-stardust border-stardust/30'
          )}
        >
          {user.xp.toLocaleString()} XP
        </Badge>
      </div>
    </motion.div>
  );
}

export function CompactLeaderboard({ users, currentUserId }: {
  users: LeaderboardUser[];
  currentUserId?: string;
}) {
  const topThree = users.slice(0, 3);

  return (
    <Card className="glass-purple">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-4 h-4 text-stardust" />
          Top Learners
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topThree.map((user, index) => {
          const styles = rankStyles[(index + 1) as 1 | 2 | 3];
          const isCurrentUser = user.id === currentUserId;

          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md',
                isCurrentUser && 'ring-2 ring-primary/50',
                'hover:bg-background/20 transition-colors'
              )}
            >
              <span className="text-lg">{styles.medal}</span>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {user.xp.toLocaleString()} XP
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
