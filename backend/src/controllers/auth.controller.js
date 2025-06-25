import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const {  email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ messgae: "All Fields Are Required" });
    }
    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: hashedPassword,
      status: "online"
    });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save(); // saves user in db

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);
    user.status = "online"

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
     
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkauth = (req, res) => {
    try {
        res.status(200).json(req.user)
    }
    catch(error){
        console.log("error in auth controller", error.message);
        res.status(500).json({message:"server errorr"})
    }
}

export const updateProfile = async (req, res) => {
  try {
  
    const { profilePic, about, username } = req.body;
    const userId = req.user._id;

    if (!profilePic  || !about) {
      return res.status(400).json({ message: "Fill Details" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url,
        about:about,
        username : username,
        profileSetup:true,
       },
      { new: true } 
    );

    res.status(200).json(updatedUser);
   
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req, res) => { //loggin out means clearing out cookies thatsall
  try {
    const userId = req.user._id;

   
    await User.findByIdAndUpdate(userId, { status: "offline" });
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};