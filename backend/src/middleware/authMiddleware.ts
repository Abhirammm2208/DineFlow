import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.merchantId = decoded.merchantId;
  next();
}
