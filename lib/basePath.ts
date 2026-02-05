/**
 * Helper to prepend base path to URLs for deployment under /voidhunter/
 * Uses NEXT_PUBLIC_BASE_PATH env var or defaults to empty string for root deployment
 */
export const withBasePath = (path: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${normalizedPath}`;
};

/**
 * Get the base path value
 */
export const getBasePath = (): string => {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
};
