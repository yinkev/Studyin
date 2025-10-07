import { ReactElement } from 'react';
import {
  Brain,
  Lightbulb,
  Target,
  TrendUp,
  BookOpen,
  ChartLine,
  Fire,
  Trophy,
  Star,
  Lightning,
  Upload,
  Check,
} from 'phosphor-react';

type IconName =
  | 'Brain'
  | 'Lightbulb'
  | 'Target'
  | 'TrendUp'
  | 'BookOpen'
  | 'ChartLine'
  | 'Fire'
  | 'Trophy'
  | 'Star'
  | 'Lightning'
  | 'Upload'
  | 'Check';

type IconSize = 'sm' | 'md' | 'lg' | 'xl';

const iconMap: Record<IconName, typeof Brain> = {
  Brain,
  Lightbulb,
  Target,
  TrendUp,
  BookOpen,
  ChartLine,
  Fire,
  Trophy,
  Star,
  Lightning,
  Upload,
  Check,
};

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

interface AuraIconProps {
  icon: IconName | string;
  size?: IconSize;
  color?: string;
  className?: string;
}

export function AuraIcon({ icon, size = 'md', color = 'currentColor', className = '' }: AuraIconProps): ReactElement {
  const IconComponent = iconMap[icon as IconName] ?? Star;
  return <IconComponent size={sizeMap[size]} color={color} weight="duotone" className={className} />;
}
