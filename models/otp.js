import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email:      { type: String, required: true, lowercase: true, trim: true },
  purpose:    { type: String, enum: ["reset_password"], required: true },
  otp_hash:   { type: String, required: true },
  attempts:   { type: Number, default: 0 },
  verified:   { type: Boolean, default: false },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt:  { type: Date, required: true },
});

otpSchema.index({ email: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);