export type UploadState = "idle" | "dragging" | "analyzing" | "result" | "error";

export type ApiError = {
  message: string;
};

export type SignatureScoreResponse = {
  score: number;
  filename: string;
  mimeType: string;
};

export type ScoreBand = {
  min: number;
  max: number;
  label: string;
  tone: "danger" | "accent" | "success";
  summary: string;
};

export type SignatureResult = SignatureScoreResponse & {
  previewUrl: string;
};

