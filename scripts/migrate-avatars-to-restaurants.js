#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admins = await User.find({ role: 'admin', avatar: { $exists: true, $ne: null }, restaurant: { $exists: true, $ne: null } });
  console.log(`Found ${admins.length} admin users with avatars and restaurant association`);

  let counter = 0;
  for (const admin of admins) {
    const restaurant = await Restaurant.findById(admin.restaurant);
    if (!restaurant) continue;
    if (!restaurant.logo || !restaurant.logo.url) {
      restaurant.logo = admin.avatar;
      await restaurant.save();
      console.log(`Migrated avatar for restaurant ${restaurant._id}`);
      // Optionally, remove avatar from user
      // admin.avatar = undefined;
      // await admin.save();
      counter++;
    }
  }

  console.log(`Migrated ${counter} avatars to restaurants`);
  mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
