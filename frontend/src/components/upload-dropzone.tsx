import { useMemo } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { ImageUp, Sparkles } from "lucide-react";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { UploadState } from "@/types";

type UploadDropzoneProps = {
  state: UploadState;
  onDragStateChange: (isDragging: boolean) => void;
  onFileAccepted: (file: File) => void;
  onFileRejected: (message: string) => void;
};

export function UploadDropzone({
  state,
  onDragStateChange,
  onFileAccepted,
  onFileRejected,
}: UploadDropzoneProps) {
  const accept = useMemo(
    () =>
      Object.fromEntries(
        ACCEPTED_FILE_TYPES.map((type) => [type, [] as string[]]),
      ),
    [],
  );

  function mapDropzoneError(rejections: FileRejection[]) {
    const firstError = rejections[0]?.errors[0];
    if (!firstError) {
      return "We could not use that file. Please try another image.";
    }

    if (firstError.code === "file-invalid-type") {
      return "Please upload a PNG, JPG, JPEG, or WebP image.";
    }

    if (firstError.code === "file-too-large") {
      return "That file is too large. Please keep uploads under 10 MB.";
    }

    return firstError.message;
  }

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept,
    maxSize: MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: state === "analyzing",
    onDragEnter: () => onDragStateChange(true),
    onDragLeave: () => onDragStateChange(false),
    onDropAccepted: ([file]) => {
      onDragStateChange(false);
      if (file) {
        onFileAccepted(file);
      }
    },
    onDropRejected: (fileRejections) => {
      onDragStateChange(false);
      onFileRejected(mapDropzoneError(fileRejections));
    },
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "animate-slide-up border border-white/70 p-1 transition-all duration-300",
        isDragActive
          ? "scale-[1.01] border-primary/60 shadow-soft"
          : "hover:-translate-y-1 hover:shadow-soft",
      )}
    >
      <input {...getInputProps()} aria-label="Upload signature image" />
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
          <ImageUp className="h-8 w-8" />
        </div>
        <CardTitle className="text-3xl">Drop your signature here</CardTitle>
        <CardDescription className="max-w-md text-base">
          Upload a handwritten signature image and we will estimate how readable
          its visual footprint is.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div
          className={cn(
            "rounded-[1.6rem] border border-dashed px-6 py-12 transition-all",
            isDragActive
              ? "border-primary bg-primary/8"
              : "border-primary/25 bg-white/45",
          )}
        >
          <p className="text-lg font-semibold text-foreground">
            {isDragActive ? "Release to analyze" : "Drag and drop a PNG, JPG, or WebP"}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Files up to {MAX_FILE_SIZE_MB} MB. The uploaded image is sent to your local
            Python API for scoring.
          </p>
          <Button className="mt-6" size="lg" type="button" onClick={open}>
            Choose a file
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-accent" />
          <span>Simple upload flow, friendly feedback, and one clear result.</span>
        </div>
      </CardContent>
    </Card>
  );
}
