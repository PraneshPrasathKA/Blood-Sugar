import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join('.') || 'root';
      if (!fieldErrors[key]) {
        fieldErrors[key] = [];
      }
      fieldErrors[key].push(issue.message);
    }

    const firstMessage = err.issues[0]?.message || 'Validation failed.';
    res.status(400).json({
      success: false,
      message: firstMessage,
      errors: fieldErrors,
    });
    return;
  }

  if (env.nodeEnv !== 'test') {
    console.error('Unhandled error:', err);
  }

  res.status(500).json({
    success: false,
    message:
      env.nodeEnv === 'production'
        ? 'Internal server error.'
        : err instanceof Error
          ? err.message
          : 'Internal server error.',
  });
}

