
import mongoose from "mongoose";

const receivedMessagesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "New document needs review",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    icon: {
      type: String,
      default: "file-check",
      immutable: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "ReceivedMessages",
  receivedMessagesSchema
);
