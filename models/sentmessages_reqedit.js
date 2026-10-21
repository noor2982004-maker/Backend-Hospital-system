
import mongoose from "mongoose";

const sendMessrequestEditsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    audience: {
      type: String,
      enum: ["doctors"],
      default: "doctors",
      immutable: true,
    },

    sent_by: {
      type: String,
      enum: ["email"],
      default: "email",
      immutable: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    date_sent: {
      type: Date,
      default: null,
    },

    email_status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
      default: "failed",
    },


    token_hash: {
  type: String,
  default: null,
  select: false,
},

expires_at: {
  type: Date,
  default: null,
},



  },
  { timestamps: true, collection: "request_edits" }
);

export default mongoose.model("RequestEdits", sendMessrequestEditsSchema);
