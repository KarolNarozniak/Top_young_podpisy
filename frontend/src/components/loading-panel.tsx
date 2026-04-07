import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { LOADING_MESSAGES } from "@/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function LoadingPanel() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(28);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1500);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? 90 : current + 9));
    }, 500);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  return (
    <Card className="animate-slide-up overflow-hidden border border-white/70">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-16 w-16 animate-float items-center justify-center rounded-full bg-primary/12 text-primary">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
        <CardTitle className="text-3xl">Analyzing your signature</CardTitle>
        <CardDescription className="max-w-md text-base">
          The frontend is uploading your file and waiting for the Python scorer to
          return the readability score.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            <span>Current step</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} aria-label="Signature analysis progress" />
        </div>

        <div className="rounded-[1.5rem] border border-white/70 bg-white/55 px-5 py-4 text-center shadow-inner">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Live status
          </p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {LOADING_MESSAGES[messageIndex]}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

