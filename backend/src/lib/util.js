import jwt from "jsonwebtoken";
import crypto from "crypto"
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
    });
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd
  });
  return token;
};

export const generateGroupToken = () => {
  return crypto.randomBytes(32).toString('hex'); // 64 characters
};