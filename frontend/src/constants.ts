import type { ScoreBand } from "./types";

export const ACCEPTED_FILE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const LOADING_MESSAGES = [
  "Checking every curve and crossing stroke...",
  "Measuring the signature footprint...",
  "Mapping ink density across the page...",
  "Turning your upload into a readability score...",
];

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 0,
    max: 34,
    label: "Hard to read",
    tone: "danger",
    summary: "This signature is quite compressed or sparse, so readability is low.",
  },
  {
    min: 35,
    max: 69,
    label: "Moderately readable",
    tone: "accent",
    summary: "The signature has a decent footprint, but clarity could still improve.",
  },
  {
    min: 70,
    max: 100,
    label: "Clear signature",
    tone: "success",
    summary: "This signature spreads nicely and reads as clear and confident.",
  },
];

