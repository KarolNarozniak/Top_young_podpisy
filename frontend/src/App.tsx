import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileImage } from "lucide-react";
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "@/constants";
import { LoadingPanel } from "@/components/loading-panel";
import { ResultPanel } from "@/components/result-panel";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApiError, SignatureResult, UploadState } from "@/types";
import { scoreSignature } from "@/services/api";

function validateFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "Please upload a PNG, JPG, JPEG, or WebP image.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "That file is too large. Please keep uploads under 10 MB.";
  }

  return null;
}

function App() {
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SignatureResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const statusBadge = useMemo(() => {
    if (state === "result") {
      return <Badge variant="success">Result ready</Badge>;
    }

    if (state === "analyzing") {
      return <Badge variant="accent">Processing</Badge>;
    }

    return <Badge variant="neutral">Ready to upload</Badge>;
  }, [state]);

  async function handleFileAccepted(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setState("error");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setErrorMessage(null);
    setState("analyzing");

    try {
      const response = await scoreSignature(file);
      setResult({
        ...response,
        previewUrl: nextPreviewUrl,
      });
      setState("result");
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(apiError.message);
      setState("error");
    }
  }

  function handleFileRejected(message: string) {
    setErrorMessage(message);
    setState("error");
  }

  function handleDragStateChange(isDragging: boolean) {
    setState((current) => {
      if (current === "analyzing" || current === "result") {
        return current;
      }

      if (current === "error" && !isDragging) {
        return current;
      }

      return isDragging ? "dragging" : "idle";
    });
  }

  function handleReset() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setResult(null);
    setErrorMessage(null);
    setState("idle");
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-50" aria-hidden="true" />

      <section className="container flex min-h-screen flex-col justify-center py-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-xl space-y-6">
            {statusBadge}

            <div className="space-y-5">
              <p className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Signature
                <span className="block bg-gradient-to-r from-primary via-[#ff9d5c] to-accent bg-clip-text text-transparent">
                  Score Studio
                </span>
              </p>
              <p className="max-w-lg text-lg leading-8 text-muted-foreground sm:text-xl">
                Drop in a handwritten signature image and get back a clear,
                polished score screen powered by your existing Python analysis.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="glass-card rounded-[1.5rem] border border-white/60 p-5 shadow-card">
                <FileImage className="h-6 w-6 text-primary" />
                <p className="mt-4 font-semibold text-foreground">Image upload first</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Built around one main task so the experience stays obvious and calm.
                </p>
              </div>
              <div className="glass-card rounded-[1.5rem] border border-white/60 p-5 shadow-card">
                <CheckCircle2 className="h-6 w-6 text-success" />
                <p className="mt-4 font-semibold text-foreground">Backend-ready flow</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The UI already posts to an API, so swapping in your future backend is simple.
                </p>
              </div>
            </div>

            {state === "error" && errorMessage ? (
              <div
                className="glass-card rounded-[1.5rem] border border-danger/30 p-5 shadow-card"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-danger/10 p-2 text-danger">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="space-y-3">
                    <p className="font-semibold text-foreground">We could not analyze that upload.</p>
                    <p className="text-sm leading-6 text-muted-foreground">{errorMessage}</p>
                    <Button variant="secondary" onClick={handleReset}>
                      Try another file
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="w-full max-w-2xl flex-1">
            {state === "analyzing" ? (
              <LoadingPanel />
            ) : state === "result" && result ? (
              <ResultPanel result={result} onReset={handleReset} />
            ) : (
              <UploadDropzone
                state={state}
                onDragStateChange={handleDragStateChange}
                onFileAccepted={handleFileAccepted}
                onFileRejected={handleFileRejected}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
