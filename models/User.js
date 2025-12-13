import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer' },
    approved: { type: Boolean, default: false },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false },
    location: { type: String },
    avatar: {
      url: { type: String },
      public_id: { type: String }
    }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
