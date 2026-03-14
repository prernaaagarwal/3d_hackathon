/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract Bearer token from Authorization header
 */
export const extractBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

/**
 * Format AED currency
 */
export const formatAed = (amount: number): string => {
  return `AED ${amount.toLocaleString('en-AE')}`;
};

