import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
// Temporarily use native range until Slider wrapper env issue is resolved

interface ChatControlsProps {
  level: number;
  profile: string;
  verbosity: 'concise' | 'balanced' | 'detailed';
  effort: 'minimal' | 'low' | 'medium' | 'high';
  onLevel: (level: number) => void;
  onProfile: (profile: string) => void;
  onVerbosity: (verbosity: 'concise' | 'balanced' | 'detailed') => void;
  onEffort: (effort: 'minimal' | 'low' | 'medium' | 'high') => void;
  showReconnect: boolean;
  reconnectDisabled: boolean;
  onReconnect: () => void;
  reconnectLabel: string;
  className?: string;
}

export function ChatControls({
  level,
  profile,
  verbosity,
  effort,
  onLevel,
  onProfile,
  onVerbosity,
  onEffort,
  showReconnect,
  reconnectDisabled,
  onReconnect,
  reconnectLabel,
  className,
}: ChatControlsProps) {
  return (
    <TooltipProvider>
    <div className={cn('flex flex-wrap items-center gap-3', className)} data-testid="chat-controls">
      {/* Level */}
      <div className="flex items-center gap-2">
        <label htmlFor="chat-level" className="text-xs uppercase tracking-wider text-muted-foreground">
          Level {level}
        </label>
        <input
          id="chat-level"
          data-testid="slider-level"
          type="range"
          min={1}
          max={5}
          value={level}
          onChange={(e) => onLevel(Number(e.target.value))}
          className="h-2 w-40 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>

      {/* Learning Mode */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="text-xs uppercase tracking-wider text-muted-foreground" htmlFor="learning-mode">
              Learning Mode
            </label>
          </TooltipTrigger>
          <TooltipContent>Preset defaults for Verbosity and Reasoning</TooltipContent>
        </Tooltip>
        <Select value={profile} onValueChange={onProfile}>
          <SelectTrigger id="learning-mode" data-testid="select-learning-mode" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="studyin_fast">Fast</SelectItem>
            <SelectItem value="studyin_study">Study</SelectItem>
            <SelectItem value="studyin_deep">Deep</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verbosity */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="text-xs uppercase tracking-wider text-muted-foreground" htmlFor="verbosity">
              Verbosity
            </label>
          </TooltipTrigger>
          <TooltipContent>Concise · Balanced · Detailed</TooltipContent>
        </Tooltip>
        <Select value={verbosity} onValueChange={(v) => onVerbosity(v as ChatControlsProps['verbosity'])}>
          <SelectTrigger id="verbosity" data-testid="select-verbosity" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="concise">Concise</SelectItem>
            <SelectItem value="balanced">Balanced</SelectItem>
            <SelectItem value="detailed">Detailed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reasoning Speed */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="text-xs uppercase tracking-wider text-muted-foreground" htmlFor="reasoning-speed">
              Reasoning
            </label>
          </TooltipTrigger>
          <TooltipContent>Lower = faster · Higher = more deliberate</TooltipContent>
        </Tooltip>
        <Select value={effort} onValueChange={(v) => onEffort(v as ChatControlsProps['effort'])}>
          <SelectTrigger id="reasoning-speed" data-testid="select-effort" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showReconnect && (
        <Button
          variant="secondary"
          size="sm"
          data-testid="btn-reconnect"
          onClick={onReconnect}
          disabled={reconnectDisabled}
          className="ml-2"
        >
          {reconnectLabel}
        </Button>
      )}
    </div>
    </TooltipProvider>
  );
}

export default ChatControls;
