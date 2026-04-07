import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase",
  {
    variants: {
      variant: {
        neutral: "border-white/70 bg-white/70 text-muted-foreground",
        accent: "border-transparent bg-accent/20 text-foreground",
        success: "border-transparent bg-success/15 text-success",
        danger: "border-transparent bg-danger/15 text-danger",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

