import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

export type SignatureScoreResult = {
  score: number;
  occupiedChunks: number;
  totalChunks: number;
  occupancyMap: number[][];
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  } | null;
  imageSize: { width: number; height: number };
  croppedSize: { width: number; height: number } | null;
};

type SignatureScoreOptions = {
  gridRows?: number;
  gridCols?: number;
  whiteThreshold?: number;
  minInkPixelsPerChunk?: number;
  addBoundingBoxPadding?: number;
};

export async function calculateSignatureCoverageScore(
  fileBytes: Uint8Array,
  options: SignatureScoreOptions = {}
): Promise<SignatureScoreResult> {
  const {
    gridRows = 4,
    gridCols = 8,
    whiteThreshold = 220,
    minInkPixelsPerChunk = 3,
    addBoundingBoxPadding = 2,
  } = options;

  const img = await Image.decode(fileBytes);
  const width = img.width;
  const height = img.height;

  // Build binary mask from bitmap (RGBA, 4 bytes per pixel)
  const bitmap = img.bitmap;
  const binaryMask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = bitmap[idx];
      const g = bitmap[idx + 1];
      const b = bitmap[idx + 2];
      const a = bitmap[idx + 3];

      if (a === 0) {
        binaryMask[y * width + x] = 0;
        continue;
      }

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      binaryMask[y * width + x] = brightness < whiteThreshold ? 1 : 0;
    }
  }

  // Find bounding box
  const boundingBox = findBoundingBox(binaryMask, width, height, addBoundingBoxPadding);

  const totalChunks = gridRows * gridCols;

  if (!boundingBox) {
    return {
      score: 0,
      occupiedChunks: 0,
      totalChunks,
      occupancyMap: Array.from({ length: gridRows }, () => Array(gridCols).fill(0)),
      boundingBox: null,
      imageSize: { width, height },
      croppedSize: null,
    };
  }

  // Analyze cropped bounding box area
  const croppedWidth = boundingBox.width;
  const croppedHeight = boundingBox.height;
  const occupancyMap: number[][] = Array.from({ length: gridRows }, () =>
    Array(gridCols).fill(0)
  );
  let occupiedChunks = 0;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const startX = Math.floor((col * croppedWidth) / gridCols);
      const endX = Math.floor(((col + 1) * croppedWidth) / gridCols);
      const startY = Math.floor((row * croppedHeight) / gridRows);
      const endY = Math.floor(((row + 1) * croppedHeight) / gridRows);

      let inkCount = 0;
      let marked = false;

      for (let y = startY; y < endY && !marked; y++) {
        const sourceY = boundingBox.minY + y;
        for (let x = startX; x < endX && !marked; x++) {
          const sourceX = boundingBox.minX + x;
          if (binaryMask[sourceY * width + sourceX] === 1) {
            inkCount++;
            if (inkCount >= minInkPixelsPerChunk) {
              occupancyMap[row][col] = 1;
              occupiedChunks++;
              marked = true;
            }
          }
        }
      }
    }
  }

  const score = Math.round((occupiedChunks / totalChunks) * 10000) / 100;

  return {
    score,
    occupiedChunks,
    totalChunks,
    occupancyMap,
    boundingBox,
    imageSize: { width, height },
    croppedSize: { width: croppedWidth, height: croppedHeight },
  };
}

function findBoundingBox(
  binaryMask: Uint8Array,
  width: number,
  height: number,
  padding: number
): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } | null {
  let minX = width, minY = height, maxX = -1, maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (binaryMask[y * width + x] === 1) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) return null;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  return { minX, minY, maxX, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
