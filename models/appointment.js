import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointment_date: { type: Date, required: true },
    appointment_time: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    notes: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ["upcoming", "completed", "missed", "cancelled"],
      default: "upcoming",
    },
    booking_reference: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

appointmentSchema.index(
  { doctor_id: 1, appointment_date: 1, appointment_time: 1 },
  { unique: true, partialFilterExpression: { status: "upcoming" } },
);
appointmentSchema.index({ patient_id: 1, appointment_date: -1 });

export default mongoose.model("Appointment", appointmentSchema);
