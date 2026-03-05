import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { ValidationError } from '../utils/error.util.js';

export const validate = (schema: AnyZodObject) => {
  return async (
    req: Request,
    _: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      next(new ValidationError('Validation failed', error));
    }
  };
};
