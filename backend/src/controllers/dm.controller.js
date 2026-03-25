import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../../index.js";

// ─── POST /api/dm/create ────────────────────────────────────────────────────
export const createDM = async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "Target user ID is required" });
    }

    if (userId.toString() === targetUserId) {
      return res.status(400).json({ message: "Cannot DM yourself" });
    }

    // Check friendship
    const user = await User.findById(userId);
    if (!user.friends.some((f) => f.toString() === targetUserId)) {
      return res.status(403).json({ message: "You can only DM friends" });
    }

    // Check if DM already exists
    const existing = await Conversation.findOne({
      type: "dm",
      participants: { $all: [userId, targetUserId], $size: 2 },
    });

    if (existing) {
      return res.status(200).json({ data: existing });
    }

    const conversation = await Conversation.create({
      type: "dm",
      participants: [userId, targetUserId],
    });

    return res.status(201).json({ data: conversation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/dm/group/create ──────────────────────────────────────────────
export const createGroupDM = async (req, res) => {
  try {
    const userId = req.user._id;
    const { participantIds, name } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ message: "At least one participant is required" });
    }

    const allParticipants = [...new Set([userId.toString(), ...participantIds])];
    if (allParticipants.length > 10) {
      return res.status(400).json({ message: "Group DM limited to 10 participants" });
    }

    // Verify all participants are friends of the creator
    const user = await User.findById(userId);
    const friendIds = user.friends.map((f) => f.toString());
    const nonFriends = participantIds.filter((id) => !friendIds.includes(id));
    if (nonFriends.length > 0) {
      return res.status(403).json({ message: "All participants must be your friends" });
    }

    const conversation = await Conversation.create({
      type: "group_dm",
      participants: allParticipants,
      name: name || null,
    });

    return res.status(201).json({ data: conversation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/dm/conversations ──────────────────────────────────────────────
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username profilePic status")
      .sort({ "lastMessage.timestamp": -1, updatedAt: -1 });

    return res.status(200).json({ data: conversations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/dm/:conversationId/messages ───────────────────────────────────
export const getDMMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { before } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not a participant" });
    }

    const query = { conversation: conversationId };
    if (before) query._id = { $lt: before };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username profilePic")
      .populate({
        path: "replyTo",
        select: "text sender",
        populate: { path: "sender", select: "username" },
      });

    return res.status(200).json({
      data: messages.reverse(),
      hasMore: messages.length === 50,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/dm/:conversationId/messages ──────────────────────────────────
export const sendDMMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const sender = req.user._id;
    const { text, replyTo } = req.body;
    const image = req.file;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    if (!conversation.participants.some((p) => p.toString() === sender.toString())) {
      return res.status(403).json({ message: "Not a participant" });
    }

    if (!image && !text) {
      return res.status(400).json({ message: "Provide some content" });
    }

    let imageUrl;
    if (image) {
      const base64Image = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "dm_messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const message = await Message.create({
      conversation: conversationId,
      sender,
      text: text || "",
      image: imageUrl,
      replyTo: replyTo || null,
    });

    // Update last message
    conversation.lastMessage = {
      text: text || "(image)",
      sender,
      timestamp: new Date(),
    };
    await conversation.save();

    await message.populate("sender", "username profilePic");
    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: "text sender",
        populate: { path: "sender", select: "username" },
      });
    }

    io.to(`conversation:${conversationId}`).emit("dm-message", message);

    return res.status(201).json({ data: message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
