import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    method: String,
    route: String,
    status: Number,
    requestBody: mongoose.Schema.Types.Mixed,
    requestQuery: mongoose.Schema.Types.Mixed,
    requestParams: mongoose.Schema.Types.Mixed,
    responseTimeMs: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  { timestamps: true }
);

const Log = mongoose.models.Log || mongoose.model('Log', logSchema);
export default Log;
