
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

// Attach user to request if a valid JWT is present
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return next();
  const parts = auth.split(' ');
  if (parts.length !== 2) return next();
  const token = parts[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (user) {
      req.user = { id: user._id.toString(), role: user.role, approved: user.approved, restaurant: user.restaurant };
    }
  } catch (e) {
    // invalid token — ignore and continue
  }
  next();
}

// Role enforcement helper e.g. requireRole('super-admin')
export function requireRole(role) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ message: 'Unauthorized' });
    if (u.role !== role) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
