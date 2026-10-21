import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    patient_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor_id:  { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: "rating must be an integer" },
    },
    comment: { type: String, trim: true },
    is_visible: {
  type: Boolean,
  default: true,
},
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);
reviewSchema.index({ patient_id: 1, doctor_id: 1 }, { unique: true });
reviewSchema.index({ doctor_id: 1, created_at: -1 });

export default mongoose.model("Review", reviewSchema);