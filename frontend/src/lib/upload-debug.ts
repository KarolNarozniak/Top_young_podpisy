type UploadDebugDetails = Record<string, unknown>;

export function logUploadDebug(event: string, details: UploadDebugDetails = {}) {
  if (!import.meta.env.DEV) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.debug(`[upload-debug] ${timestamp} ${event}`, details);
}

