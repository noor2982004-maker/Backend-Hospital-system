import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    password: {
      type: String,
      select: false,
      required: function () {
        return !this.google_id;
      },
    },
    avatar: { type: String, default: null },
    avatar_public_id: { type: String, select: false },
    google_id: { type: String, unique: true, sparse: true },
    gender: { type: String, enum: ["male", "female"] },
    governorate: { type: String, trim: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

export default mongoose.model("User", userSchema);
