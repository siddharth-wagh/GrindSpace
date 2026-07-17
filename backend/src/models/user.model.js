import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },
    about: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["online", "offline", "idle", "dnd"],
      default: "offline",
    },
    profileSetup: {
      type: Boolean,
      default: false,
    },
    servers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Server",
      },
    ],
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    friendRequests: {
      incoming: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      outgoing: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    codeforcesHandle: {
      type: String,
      trim: true,
    },
    cfLastSubmissionId: {
      type: Number,
      default: 0,
    },
    cfRating: {
      type: Number,
      default: 0,
    },
    cfMaxRating: {
      type: Number,
      default: 0,
    },
    cfRank: {
      type: String,
      default: "",
    },
    cfLastSyncedAt: {
      type: Date,
      default: null,
    },
    leetcodeHandle: {
      type: String,
      trim: true,
    },
    lcLastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ codeforcesHandle: 1 }, { unique: true, sparse: true });
userSchema.index({ leetcodeHandle: 1 }, { unique: true, sparse: true });

const User = mongoose.model("User", userSchema);

export default User;
