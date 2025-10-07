import { Card, CardContent, CardHeader } from '../ui/card';
import { cn } from '../ui/utils';

export function ChartCard({ title, description, className, children }: { title: string; description?: string; className?: string; children: React.ReactNode }) {
  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader className="pb-2 text-sm">
        <div>{title}</div>
        {description ? <p className="text-xs font-normal text-slate-300/90">{description}</p> : null}
      </CardHeader>
      <CardContent className="relative h-full p-0 pb-4">{children}</CardContent>
    </Card>
  );
}
