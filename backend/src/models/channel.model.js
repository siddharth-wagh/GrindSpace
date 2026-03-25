import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["text", "voice"],
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
    topic: {
      type: String,
      default: "",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

channelSchema.index({ server: 1, position: 1 });

const Channel = mongoose.model("Channel", channelSchema);
export default Channel;
