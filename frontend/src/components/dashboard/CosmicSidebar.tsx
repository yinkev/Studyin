/**
 * CosmicSidebar - Space-themed navigation sidebar
 * NO GRADIENTS - glassmorphism with solid colors
 */

import { motion } from 'motion/react';
import {
  Home,
  TrendingUp,
  Award,
  Users,
  Settings,
  BookOpen,
  MessageSquare,
  Upload,
  LucideIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { View } from '@/components/NavBar';

interface NavItem {
  id: View;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

interface CosmicSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  userLevel?: number;
  userXP?: number;
  userAvatar?: string;
  userName?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'analytics', label: 'Progress', icon: TrendingUp },
  { id: 'upload', label: 'Library', icon: BookOpen },
  { id: 'chat', label: 'AI Coach', icon: MessageSquare, badge: 'Beta' }
];

const secondaryItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function CosmicSidebar({
  currentView,
  onNavigate,
  userLevel = 1,
  userXP = 0,
  userName = 'Medical Student',
  userAvatar
}: CosmicSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 glass-purple border-r border-primary/20 z-40 flex flex-col">
      {/* Logo / Brand */}
      <div className="p-4 lg:p-6">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center glow-primary shrink-0">
            <span className="text-xl font-black text-primary">S</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-black text-primary">StudyIn</h1>
            <p className="text-xs text-muted-foreground">Medical Mastery</p>
          </div>
        </motion.div>
      </div>

      {/* User profile */}
      <div className="px-4 lg:px-6 pb-4 lg:pb-6">
        <motion.div
          className="glass rounded-xl p-3 lg:p-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex lg:flex-col items-center lg:items-start gap-3">
            <Avatar className="w-10 h-10 lg:w-12 lg:h-12 ring-2 ring-primary/30 shrink-0">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{userName}</h3>
              <p className="text-xs text-muted-foreground">
                Level {userLevel} • {userXP.toLocaleString()} XP
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 lg:px-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
            index={index}
          />
        ))}

        <div className="my-4 lg:my-6 border-t border-border/50" />

        {secondaryItems.map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
            index={navItems.length + index}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 lg:p-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center lg:text-left">
          <span className="hidden lg:inline">StudyIn v1.0.0</span>
          <span className="lg:hidden">v1.0</span>
        </p>
      </div>
    </aside>
  );
}

function NavButton({
  item,
  active,
  onClick,
  index
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all duration-300 group relative',
        active
          ? 'bg-primary/20 text-primary glow-primary'
          : 'text-muted-foreground hover:bg-background/30 hover:text-foreground'
      )}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full glow-primary"
          layoutId="activeIndicator"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <Icon
        className={cn(
          'w-5 h-5 shrink-0 transition-transform group-hover:scale-110',
          active && 'animate-pulse'
        )}
      />
      <span className="hidden lg:block font-medium text-sm truncate">
        {item.label}
      </span>
      {item.badge && (
        <Badge
          variant="secondary"
          className="hidden lg:inline-flex text-xs ml-auto"
        >
          {item.badge}
        </Badge>
      )}
    </motion.button>
  );
}
