import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold tracking-wide transition-transform transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ease-soft-bounce",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft-button hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-elevated active:translate-y-0 focus-visible:-translate-y-0.5 focus-visible:shadow-elevated",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:-translate-y-0.5",
        outline:
          "border border-border bg-background/80 text-foreground shadow-soft hover:-translate-y-0.5 hover:bg-background focus-visible:bg-background",
        secondary:
          "bg-secondary/90 text-secondary-foreground shadow-soft-button hover:-translate-y-0.5 hover:bg-secondary",
        ghost:
          "text-foreground hover:bg-muted/60 hover:-translate-y-0.5 focus-visible:bg-muted/70",
        link: "text-primary underline-offset-4 hover:underline hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 rounded-full px-3 text-xs",
        lg: "h-12 rounded-full px-6 text-sm",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
