import mongoose from "mongoose";

const solveSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contestId: {
      type: Number,
      required: true,
    },
    index: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
    source: {
      type: String,
      enum: ["cf", "manual"],
      default: "cf",
    },
    solvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

solveSchema.index({ user: 1, contestId: 1, index: 1 }, { unique: true });
solveSchema.index({ user: 1, solvedAt: -1 });

const Solve = mongoose.model("Solve", solveSchema);
export default Solve;
