'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground shadow-lg',
      'data-[state=delayed-open]:data-[side=top]:animate-in data-[state=delayed-open]:data-[side=top]:fade-in-0 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-1',
      'data-[state=delayed-open]:data-[side=bottom]:animate-in data-[state=delayed-open]:data-[side=bottom]:fade-in-0 data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-1',
      'data-[state=delayed-open]:data-[side=left]:animate-in data-[state=delayed-open]:data-[side=left]:fade-in-0 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-1',
      'data-[state=delayed-open]:data-[side=right]:animate-in data-[state=delayed-open]:data-[side=right]:fade-in-0 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-1',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };

