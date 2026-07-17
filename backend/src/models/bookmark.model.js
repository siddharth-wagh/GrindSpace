import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
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
    url: {
      type: String,
      default: "",
    },
    sourceMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      default: null,
    },
    server: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      default: null,
    },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, contestId: 1, index: 1 }, { unique: true });

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
export default Bookmark;
