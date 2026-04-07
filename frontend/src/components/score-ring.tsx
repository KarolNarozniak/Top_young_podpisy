import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  tone: "danger" | "accent" | "success";
};

const toneStyles: Record<ScoreRingProps["tone"], string> = {
  danger: "text-danger",
  accent: "text-foreground",
  success: "text-success",
};

export function ScoreRing({ score, tone }: ScoreRingProps) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  const ringFill =
    tone === "success"
      ? "rgba(58, 167, 110, 0.94)"
      : tone === "danger"
        ? "rgba(230, 92, 66, 0.92)"
        : "rgba(201, 129, 255, 0.9)";

  return (
    <div className="relative mx-auto h-40 w-40">
      <div
        className="absolute inset-0 rounded-full shadow-glow"
        style={
          {
            background: `conic-gradient(${ringFill} 0deg ${degrees}deg, rgba(255,255,255,0.7) ${degrees}deg 360deg)`,
          } as CSSProperties
        }
      />
      <div className="absolute inset-[12px] flex flex-col items-center justify-center rounded-full bg-white/90 shadow-inner">
        <span className={cn("text-5xl font-extrabold tracking-tight", toneStyles[tone])}>
          {score}
        </span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  );
}

