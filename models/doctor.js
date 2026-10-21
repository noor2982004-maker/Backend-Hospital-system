import mongoose from "mongoose";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // "14:00"

const doctorSchema = new mongoose.Schema(
  {
    user_id:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    speciality_id: { type: mongoose.Schema.Types.ObjectId, ref: "Speciality", required: true },

    bio:                          { type: String, trim: true },
    education_and_qualifications: { type: String, trim: true },
    clinic_address:               { type: String, trim: true },
    consultation_fee:             { type: Number, required: true, min: 0 },
    rating_average:               { type: Number, default: 0, min: 0, max: 5 },

    title:               { type: String, trim: true },
    image:               { type: String, trim: true, default: null },
    years_of_experience: { type: Number, default: 0, min: 0 },
    clinic_name:         { type: String, trim: true },
    area:                { type: String, trim: true },
    governorate:         { type: String, trim: true },
    rating_count:        { type: Number, default: 0, min: 0 },
    approval_status: { type: String, enum: ["pending", "accepted", "cancelled","require_edits"], default: "pending" },
    schedule: {
      working_days: {
        type: [Number], 
        default: [],
        validate: {
          validator: (v) =>
            v.every((d) => Number.isInteger(d) && d >= 0 && d <= 6) && new Set(v).size === v.length,
          message: "working_days must be unique numbers from 0 (Sunday) to 6 (Saturday)",
        },
      },
      start_time:  { type: String, match: TIME_REGEX },
      end_time:    { type: String, match: TIME_REGEX },
      break_start: { type: String, match: TIME_REGEX, default: null },
      break_end:   { type: String, match: TIME_REGEX, default: null },
    },
    slot_duration_minutes: { type: Number, default: 30, min: 5, max: 240 },
    days_off:              { type: [Date], default: [] },

    clinic_phone:   { type: String, trim: true },
    languages:      { type: [String], default: [] },
    license_number: { type: String, trim: true, unique: true, sparse: true },
    location: {
      latitude:  { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.pre("validate", function () {
  const s = this.schedule;

  if (!s || !s.working_days || s.working_days.length === 0) {
    return;
  }

  if (!s.start_time || !s.end_time) {
    throw new Error(
      "schedule start_time and end_time are required when working_days is set"
    );
  }

  if (s.start_time >= s.end_time) {
    throw new Error("schedule end_time must be after start_time");
  }

  if (s.break_start || s.break_end) {
    if (!s.break_start || !s.break_end) {
      throw new Error(
        "break_start and break_end must be set together"
      );
    }

    if (s.break_start >= s.break_end) {
      throw new Error("break_end must be after break_start");
    }

    if (
      s.break_start < s.start_time ||
      s.break_end > s.end_time
    ) {
      throw new Error("break must be inside working hours");
    }
  }
});

doctorSchema.index({ speciality_id: 1 });
doctorSchema.index({ governorate: 1, area: 1 });
doctorSchema.index({ is_active: 1, rating_average: -1 });

export default mongoose.model("Doctor", doctorSchema);



