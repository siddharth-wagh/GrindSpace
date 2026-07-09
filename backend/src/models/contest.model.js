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
    ratingMin: {
      type: Number,
      default: 800,
    },
    ratingMax: {
      type: Number,
      default: 1500,
    },
    problemCount: {
      type: Number,
      default: 5,
    },
    scheduledStart: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["lobby", "running", "ended"],
      default: "lobby",
    },
  },
  { timestamps: true }
);

contestSchema.index({ channel: 1, status: 1 });
contestSchema.index({ status: 1, scheduledStart: 1 });

const Contest = mongoose.model("Contest", contestSchema);
export default Contest;
