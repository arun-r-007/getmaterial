import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Utility function to convert text to title case for display
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Utility function to normalize text for storage (lowercase, trimmed)
export function normalizeForStorage(str) {
  if (!str) return '';
  return str.trim().toLowerCase();
}
