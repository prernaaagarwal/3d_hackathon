import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Request body validation middleware using Zod schemas.
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = (result.error as ZodError).flatten();
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.fieldErrors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
};

/**
 * Query params validation middleware using Zod schemas.
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = (result.error as ZodError).flatten();
      res.status(400).json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: errors.fieldErrors,
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).query = result.data;
    next();
  };
};

