import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>;

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const normalizedValue = value ?? 0;

  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-white/70 shadow-inner",
        className,
      )}
      value={normalizedValue}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full origin-left rounded-full bg-gradient-to-r from-primary via-[#ffb16e] to-accent transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${100 - normalizedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
