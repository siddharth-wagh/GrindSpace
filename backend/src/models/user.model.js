import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index:true
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      index:true
    },
    profilePic: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["online", "offline", "studying"],
      default: "offline",
    },
    groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  },{ timestamps: true });

const User = mongoose.model("User", userSchema);

export default User;
