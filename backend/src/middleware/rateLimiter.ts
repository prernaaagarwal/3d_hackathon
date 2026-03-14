import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-based rate limiting.
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number;   // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export const rateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    const record = requestCounts.get(key);

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      });
      return;
    }

    record.count++;
    next();
  };
};

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

