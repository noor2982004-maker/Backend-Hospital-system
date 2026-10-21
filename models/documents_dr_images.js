
import mongoose from "mongoose";

const doctorDocumentSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    file_name: {
      type: String,
      required: true,
    },

    file_url: {
      type: String,
      required: true,
    },

    file_public_id: {
      type: String,
      required: true,
    },

    uploaded_by_role: {
      type: String,
      enum: ["admin", "doctor"],
      required: true,
      default: "admin",
      index: true,
    },



  },
  { timestamps: true }
);

export default mongoose.model("DoctorDocument", doctorDocumentSchema);
