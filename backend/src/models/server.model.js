import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "moderator", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const serverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/user-group-with-shadow_78370-7019.jpg?semt=ais_hybrid&w=740",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [memberSchema],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (val) => val.length <= 5,
        message: "You can add up to 5 tags only",
      },
    },
    categories: [categorySchema],
  },
  { timestamps: true }
);

serverSchema.index({ name: "text" });

const Server = mongoose.model("Server", serverSchema);
export default Server;
