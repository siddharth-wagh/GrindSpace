import Message from "../models/message.model.js";
import Channel from "../models/channel.model.js";
import Server from "../models/server.model.js";
import cloudinary from "../lib/cloudinary.js";
import { io } from "../../index.js";

// ─── POST /api/messages/:channelId ──────────────────────────────────────────
export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const sender = req.user._id;
    const { text, replyTo } = req.body;
    const image = req.file;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const server = await Server.findById(channel.server);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user.toString() === sender.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this server" });

    if (!image && !text) {
      return res.status(400).json({ message: "Provide some content" });
    }

    let imageUrl;
    if (image) {
      const base64Image = `data:${image.mimetype};base64,${image.buffer.toString("base64")}`;
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "messages",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const message = await Message.create({
      channel: channel._id,
      server: channel.server,
      sender,
      image: imageUrl,
      text: text || "",
      replyTo: replyTo || null,
    });

    await message.populate("sender", "username profilePic");
    if (message.replyTo) {
      await message.populate({
        path: "replyTo",
        select: "text sender",
        populate: { path: "sender", select: "username" },
      });
    }

    io.to(`channel:${channel._id}`).emit("new-message", message);

    return res.status(201).json({ data: message, message: "Success" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/messages/:channelId ───────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;
    const { before } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const server = await Server.findById(channel.server);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this server" });

    const query = { channel: channelId };
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

// ─── DELETE /api/messages/:messageId ────────────────────────────────────────
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Allow sender or server admin/owner/mod to delete
    let canDelete = message.sender.toString() === userId.toString();

    if (!canDelete && message.server) {
      const server = await Server.findById(message.server);
      if (server) {
        const member = server.members.find((m) => m.user.toString() === userId.toString());
        canDelete = member && ["owner", "admin", "moderator"].includes(member.role);
      }
    }

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    const room = message.channel
      ? `channel:${message.channel}`
      : `conversation:${message.conversation}`;
    io.to(room).emit("message-deleted", messageId);

    return res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/messages/:messageId ───────────────────────────────────────────
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can only edit your own messages" });
    }

    message.text = text.trim();
    message.edited = true;
    await message.save();
    await message.populate("sender", "username profilePic");

    const room = message.channel
      ? `channel:${message.channel}`
      : `conversation:${message.conversation}`;
    io.to(room).emit("message-edited", {
      messageId: message._id,
      text: message.text,
      edited: true,
    });

    return res.status(200).json({ data: message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/messages/:messageId/reactions ────────────────────────────────
export const toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existingReaction = message.reactions.find((r) => r.emoji === emoji);

    if (existingReaction) {
      const userIndex = existingReaction.users.findIndex(
        (u) => u.toString() === userId.toString()
      );
      if (userIndex > -1) {
        existingReaction.users.splice(userIndex, 1);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingReaction.users.push(userId);
      }
    } else {
      message.reactions.push({ emoji, users: [userId] });
    }

    await message.save();

    const room = message.channel
      ? `channel:${message.channel}`
      : `conversation:${message.conversation}`;
    io.to(room).emit("message-reaction-update", {
      messageId: message._id,
      reactions: message.reactions,
    });

    return res.status(200).json({ data: message.reactions });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
