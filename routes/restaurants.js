import express from 'express';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { requireRole } from '../middlewares/auth.js';

const router = express.Router();

// Get pending restaurants for superadmin review
router.get('/pending', requireRole('super-admin'), async (req, res) => {
  try {
    const pending = await Restaurant.find({ status: 'pending' }).populate('owner', 'name email').select('+logo');
    res.json(pending);
  } catch (e) {
    res.status(500).json({ message: 'Failed to load pending restaurants' });
  }
});

// Approve a restaurant and mark owner as approved
router.post('/:id/approve', requireRole('super-admin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: 'Not found' });

    restaurant.status = 'approved';
    restaurant.approved = true;
    await restaurant.save();

    // mark owner as approved
    await User.findByIdAndUpdate(restaurant.owner, { approved: true });

    res.json({ message: 'Restaurant approved' });
  } catch (e) {
    res.status(500).json({ message: 'Approval failed' });
  }
});

export default router;
