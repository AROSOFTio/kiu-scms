import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    roleId: number;
    roleName?: string;
  };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { userId: decoded.userId, roleId: decoded.roleId };
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

/**
 * Role-based access middleware factory.
 * Usage: requireRole(['HOD', 'Lecturer']) or requireRole(['HOD'])
 * Valid academic roles: HOD | Lecturer | Student
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    try {
      const [rows]: any = await db.query(
        'SELECT name FROM roles WHERE id = ?',
        [req.user.roleId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ status: 'error', message: 'Forbidden' });
      }

      const roleName = rows[0].name;
      req.user.roleName = roleName;

      if (!allowedRoles.includes(roleName)) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Requires: ${allowedRoles.join(', ')}`,
        });
      }

      next();
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
};
