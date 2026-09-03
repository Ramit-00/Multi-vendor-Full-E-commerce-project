// src/util/imageUtil.ts
import { API_URL } from '../Config/Api';

const PLACEHOLDER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23f1f5f9"><rect width="100%" height="100%" fill="%23f1f5f9"/><path d="M160 180a20 20 0 1 0 0-40 20 20 0 0 0 0 40zm-40 60l30-40 25 30 35-45 50 65H120z" fill="%2394a3b8"/><text x="50%" y="280" font-family="sans-serif" font-size="14" fill="%2364748b" text-anchor="middle">Product Image</text></svg>`;

/**
 * Normalizes product image URLs so relative paths from local folders or backend routes
 * resolve properly via the backend server, and provides an elegant fallback SVG if invalid.
 */
export const normalizeImageUrl = (img?: string | null): string => {
  if (!img || typeof img !== 'string') {
    return PLACEHOLDER_SVG;
  }

  const trimmed = img.trim();
  if (!trimmed) {
    return PLACEHOLDER_SVG;
  }

  // Already a full external URL or data URI
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const baseApi = (API_URL || 'http://localhost:8080').replace(/\/$/, '');

  // Strip leading slashes and redundant prefix
  let cleanPath = trimmed.replace(/^\/+/, '');
  if (cleanPath.startsWith('product-images/')) {
    cleanPath = cleanPath.replace(/^product-images\//, '');
  }

  // Properly URI-encode segments (supports spaces in folders like "Men shirt")
  const encodedPath = cleanPath
    .split('/')
    .map(seg => encodeURIComponent(seg))
    .join('/');

  return `${baseApi}/product-images/${encodedPath}`;
};

export const getDefaultPlaceholder = (): string => PLACEHOLDER_SVG;
