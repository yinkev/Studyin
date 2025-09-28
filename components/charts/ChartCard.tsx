import { Card, CardContent, CardHeader } from '../ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/radix/tooltip';
import { cn } from '../ui/utils';

export function ChartCard({
  title,
  description,
  helpText,
  className,
  children
}: {
  title: string;
  description?: string;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn('h-full overflow-hidden bg-white', className)}>
      <CardHeader className="pb-2 text-sm font-semibold text-slate-900">
        <div className="flex items-center justify-between gap-2">
          <span>{title}</span>
          {helpText ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`About ${title}`}
                >
                  ?
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left text-xs text-slate-600">{helpText}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {description ? <p className="text-xs font-normal text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent className="relative h-full p-0 pb-4">{children}</CardContent>
    </Card>
  );
}

