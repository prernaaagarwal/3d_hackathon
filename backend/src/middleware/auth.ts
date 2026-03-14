import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { extractBearerToken } from '../utils/helpers';
import '../types/api.types';

/**
 * JWT validation middleware.
 * Validates Supabase JWT from Authorization header and attaches user to request.
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: 'Missing authorization token', code: 'AUTH_MISSING' });
    return;
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token', code: 'AUTH_INVALID' });
    return;
  }

  req.user = user;
  req.token = token;
  next();
};

