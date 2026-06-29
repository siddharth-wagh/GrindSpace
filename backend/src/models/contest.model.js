import mongoose from "mongoose";

const contestProblemSchema = new mongoose.Schema(
  {
    contestId: Number,
    index: String,
    name: String,
    rating: Number,
    label: String,
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
    },
    name: {
      type: String,
      default: "Virtual Contest",
    },
    problems: [contestProblemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    durationMinutes: {
      type: Number,
      default: 120,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["running", "ended"],
      default: "running",
    },
  },
  { timestamps: true }
);

contestSchema.index({ channel: 1, status: 1 });

const Contest = mongoose.model("Contest", contestSchema);
export default Contest;
