import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handler — must be registered last in Express middleware chain.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  logger.error(err.message, {
    method: req.method,
    url: req.url,
    statusCode,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  res.status(statusCode).json({
    error: err.message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

