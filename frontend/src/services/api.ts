import type { ApiError, SignatureScoreResponse } from "@/types";

export async function scoreSignature(file: File): Promise<SignatureScoreResponse> {
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
    throw apiError;
  }

  return (await response.json()) as SignatureScoreResponse;
}
