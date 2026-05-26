export function getProductImageUrl(asin: string, override?: string): string {
  if (override?.trim()) {
    return override.trim();
  }
  return `https://picsum.photos/seed/${encodeURIComponent(asin)}/240/240`;
}
