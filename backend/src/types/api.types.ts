import { User } from '@supabase/supabase-js';

/**
 * Extend Express Request via declaration merging so all route handlers
 * automatically see `req.user` and `req.token` without casting.
 */
declare global {
  namespace Express {
    interface Request {
      user: User;
      token: string;
    }
  }
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

