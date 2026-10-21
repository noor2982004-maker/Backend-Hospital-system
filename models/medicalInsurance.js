import mongoose from "mongoose";

const medicalInsuranceSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    insurance_company: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    card_number: {
      type: String,
      required: true,
      minlength: 13,
      maxlength: 19,
    },
    card_last4: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 4,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    card_image: {
      type: String,
      default: null,
    },
    birth_date: {
      type: Date,
      default: null,
    },
    coverage_percentage: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

medicalInsuranceSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiry_date;
});

medicalInsuranceSchema.set("toJSON", { virtuals: true });
medicalInsuranceSchema.set("toObject", { virtuals: true });

export default mongoose.model("MedicalInsurance", medicalInsuranceSchema);