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
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
