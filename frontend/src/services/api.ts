import type { ApiError, SignatureScoreResponse } from "@/types";
import { logUploadDebug } from "@/lib/upload-debug";

export async function scoreSignature(file: File): Promise<SignatureScoreResponse> {
  logUploadDebug("api-request-started", {
    fileName: file.name,
    size: file.size,
    type: file.type,
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/signature-score", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = "We could not score that signature. Please try again.";

    try {
      const errorBody = (await response.json()) as { detail?: string };
      if (errorBody.detail) {
        message = errorBody.detail;
      }
    } catch {
      // Keep the fallback error message when the backend response is not JSON.
    }

    const apiError: ApiError = { message };
    logUploadDebug("api-request-failed", {
      status: response.status,
      message,
    });
    throw apiError;
  }

  const payload = (await response.json()) as SignatureScoreResponse;
  logUploadDebug("api-request-succeeded", {
    status: response.status,
    fileName: payload.filename,
    score: payload.score,
  });
  return payload;
}
