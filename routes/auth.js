import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { z } from 'zod';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';
import cloudinary from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional(),
  location: z.string().optional(),
  restaurantName: z.string().optional(),
  avatarUrl: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/register', upload.single('avatar'), async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const { name, email, password, role, location, avatarUrl, restaurantName } = input;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hash, role: role || 'customer', location, approved: role === 'super-admin' });

    // accept avatarUrl from frontend to avoid anonymous file upload if provided
    // For admin role, the uploaded image should be stored on the Restaurant document as `logo`.
    if (role && role.toLowerCase() !== 'admin') {
      if (avatarUrl) {
        user.avatar = { url: avatarUrl };
      }

      if (req.file) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'avatars' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(req.file.buffer);
          });

          user.avatar = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
        } catch (error) {
          console.error('Cloudinary upload failed', error);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
      }
    }

    await user.save();

    // if admin register, create a restaurants collection entry and mark as pending
    if ((role || '').toLowerCase() === 'admin') {
      const r = new Restaurant({
        name: restaurantName || `${name}'s Restaurant`,
        address: location,
        owner: user._id,
        status: 'pending',
        approved: false
      });

      // if frontend provided a URL for image, set it on restaurant.logo
      if (avatarUrl) {
        r.logo = { url: avatarUrl };
      }

      if (req.file) {
        try {
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream({ folder: 'restaurant_logos' }, (error, result) => {
              if (error) return reject(error);
              resolve(result);
            });
            stream.end(req.file.buffer);
          });

          r.logo = { url: uploadResult.secure_url, public_id: uploadResult.public_id };
        } catch (error) {
          console.error('Cloudinary upload failed', error);
          return res.status(500).json({ message: 'Cloudinary upload failed' });
        }
      }

      await r.save();
      user.restaurant = r._id;
      await user.save();
    }
    // if user is admin and not yet approved, do not issue a token - require approval flow
    if (user.role === 'admin' && !user.approved) {
      // populate the restaurant so frontend can display logo
      await user.populate('restaurant');
      return res.status(201).json({ message: 'Registered. Pending approval by a Super Admin.', user: { id: user._id, email: user.email, name: user.name, role: user.role, approved: user.approved, restaurant: user.restaurant } });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await user.populate('restaurant');
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, location: user.location, approved: user.approved, restaurant: user.restaurant } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const { email, password } = input;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role === 'admin' && !user.approved) {
      return res.status(403).json({ message: 'Your registration is pending approval by a super admin' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await user.populate('restaurant');
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role, location: user.location, approved: user.approved, restaurant: user.restaurant } });
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

export default router;
