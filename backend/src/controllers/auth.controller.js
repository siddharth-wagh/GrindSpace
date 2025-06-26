import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const {  email, password , username} = req.body;
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
      username,
      password: hashedPassword,
      status: "online"
    });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save(); // saves user in db

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        username : newUser.username
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
  
  try {
    const { email, password } = req.body;
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
    console.log("Error in login controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkauth = async (req, res) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId).populate("groups");
        res.status(200).json(user);
        console.log("postman ")
    }
    catch(error){
        console.log("error in auth controller", error.message);
        res.status(500).json({message:"server errorr"})
    }
}

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, about } = req.body;
    const userId = req.user._id;

    const updateFields = {};
    const DEFAULT_PFP = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    if (profilePic && profilePic !== DEFAULT_PFP) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateFields.profilePic = uploadResponse.secure_url;
    }
    if (about !== undefined && about.trim() !== "") {
      updateFields.about = about.trim();
    }

    updateFields.profileSetup = true;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      const currentUser = await User.findById(userId);
      return res.status(200).json(currentUser);
    }

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


export const addProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    // Convert buffer to base64 and upload to Cloudinary
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: "profile_images",
    });

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { image: result.secure_url },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.error("Error during addProfileImage:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
