import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { email, password, username } = req.body;
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
      status: "online",
    });
    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save(); // saves user in db

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
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
    user.status = "online";
    await user.save();

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

export const logout = async (req, res) => {
  //loggin out means clearing out cookies thatsall
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

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { about } = req.body;
    const DEFAULT_PFP = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const updateFields = {};

    // Handle image upload via multer memory storage + cloudinary
    if (req.file) {
      console.log(req.file);

      const streamifier = await import("streamifier");

      const streamUpload = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "profile_images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.default.createReadStream(fileBuffer).pipe(stream);
        });
      };

      const result = await streamUpload(req.file.buffer); // wait for upload to complete
      updateFields.profilePic = result.secure_url;

      if (about && about.trim() !== "") {
        updateFields.about = about.trim();
      }

      if (Object.keys(updateFields).length > 0) {
        updateFields.profileSetup = true;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
      });

      return res.status(200).json(updatedUser);
    } else {
      // If no image, update only text fields
      if (about && about.trim() !== "") {
        updateFields.about = about.trim();
        updateFields.profileSetup = true;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
        new: true,
      });

      return res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.error("error in updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
