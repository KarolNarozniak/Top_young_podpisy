import { RefreshCw, Sparkles } from "lucide-react";
import { SCORE_BANDS } from "@/constants";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SignatureResult } from "@/types";

type ResultPanelProps = {
  result: SignatureResult;
  onReset: () => void;
};

export function ResultPanel({ result, onReset }: ResultPanelProps) {
  const band =
    SCORE_BANDS.find(({ min, max }) => result.score >= min && result.score <= max) ??
    SCORE_BANDS[0];

  return (
    <Card className="animate-slide-up overflow-hidden border border-white/70">
      <CardHeader className="items-center text-center">
        <Badge variant={band.tone}>Signature result</Badge>
        <CardTitle className="mt-4 text-3xl">{band.label}</CardTitle>
        <CardDescription className="max-w-md text-base">
          {band.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(255,248,242,0.86))] p-4 shadow-inner">
            <div className="aspect-[4/3] overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_center,rgba(251,235,224,0.7),rgba(255,255,255,0.88))]">
              <img
                src={result.previewUrl}
                alt={`Preview of ${result.filename}`}
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/70 bg-white/55 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              File analyzed
            </p>
            <p className="mt-3 text-lg font-semibold text-foreground">{result.filename}</p>
            <p className="mt-1 text-sm text-muted-foreground">{result.mimeType}</p>
          </div>
        </div>

        <div className="space-y-5 text-center">
          <ScoreRing score={result.score} tone={band.tone} />

          <div className="rounded-[1.5rem] border border-white/70 bg-white/55 px-5 py-6">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Score interpretation
            </div>
            <p className="mt-4 text-lg leading-7 text-foreground">
              Scores closer to 100 mean the signature occupies the canvas in a
              clearer, more readable way.
            </p>
          </div>

          <Button size="lg" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            Upload another signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
