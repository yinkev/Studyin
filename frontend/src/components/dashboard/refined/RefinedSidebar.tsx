/**
 * RefinedSidebar - Clean, professional navigation
 * Minimal, focused design
 */

import { motion } from 'motion/react';
import {
  Home,
  TrendingUp,
  BookOpen,
  MessageSquare,
  Settings,
  type LucideIcon
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

interface RefinedSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  userLevel?: number;
  userXP?: number;
  userAvatar?: string;
  userName?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'upload', label: 'Library', icon: BookOpen },
  { id: 'chat', label: 'AI Coach', icon: MessageSquare }
];

const bottomItems: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function RefinedSidebar({
  currentView,
  onNavigate,
  userLevel = 1,
  userXP = 0,
  userName = 'Student',
  userAvatar
}: RefinedSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-72 bg-surface border-r border-border z-50 flex flex-col">
      {/* Logo */}
      <div className="p-5 lg:p-6 border-b border-border-subtle">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="text-xl font-bold text-primary-foreground">S</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold text-foreground">StudyIn</h1>
            <p className="text-xs text-muted-foreground">Medical Education</p>
          </div>
        </motion.div>
      </div>

      {/* User Profile */}
      <div className="px-4 lg:px-5 py-5 border-b border-border-subtle">
        <motion.div
          className="flex lg:flex-row items-center gap-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Avatar className="w-10 h-10 ring-2 ring-border shrink-0">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {userName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden lg:block flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{userName}</h3>
            <p className="text-xs text-muted-foreground">
              Level {userLevel} • {userXP.toLocaleString()} XP
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1">
        {navItems.map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
            index={index}
          />
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 lg:px-4 py-4 border-t border-border-subtle">
        {bottomItems.map((item, index) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
            index={navItems.length + index}
          />
        ))}
        <p className="text-xs text-muted-foreground text-center lg:text-left mt-4 px-3">
          <span className="hidden lg:inline">v1.0.0</span>
          <span className="lg:hidden">v1</span>
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
        'w-full flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all',
        'group relative',
        active
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator */}
      {active && (
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
          layoutId="activeNav"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      <Icon className={cn('w-5 h-5 shrink-0', active && 'text-primary')} />
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
