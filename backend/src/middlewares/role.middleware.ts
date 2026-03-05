import type { NextFunction, Request, Response } from 'express';
import type { User } from '../db/schema/users.schema.js';
import { ForbiddenError } from '../utils/error.util.js';

export const roleMiddleware = (...allowedRoles: User['role'][]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};
