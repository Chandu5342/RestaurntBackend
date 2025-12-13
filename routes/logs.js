import express from 'express';
import Log from '../models/Log.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(200);
    res.json({ logs });
  } catch (e) {
    console.error('list logs failed', e.message);
    res.status(500).json({ message: 'Error listing logs' });
  }
});

export default router;
