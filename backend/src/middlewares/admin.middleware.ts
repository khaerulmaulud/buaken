import type { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/error.util.js';

export const adminMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const user = req.user;

  if (!user || user.role !== 'admin') {
    throw new ForbiddenError('Access denied. Admin privileges required.');
  }

  next();
};
