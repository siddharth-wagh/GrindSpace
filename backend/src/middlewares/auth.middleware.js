import jwt from "jsonwebtoken";
import User from "../models/user.model.js";


export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;  //it is called jwt cuz in lib/util it iscalled jwt

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); //cookie has userid encoded in it, so this verifies it

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    let user = await User.findById(decoded.userId).select("-password");

    if (!user && typeof decoded.userId === "string") {
      user = await User.findOne({ email: decoded.userId }).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; 

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    if (error.name === "CastError") {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    res.status(500).json({ message: "Internal server error" });
  }
};