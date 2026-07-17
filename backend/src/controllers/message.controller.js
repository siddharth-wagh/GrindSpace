import Message from "../models/message.model.js";
import Channel from "../models/channel.model.js";
import Server from "../models/server.model.js";
import { io } from "../../index.js";
import { attachProblemMetadata } from "./ledger.controller.js";

// ─── POST /api/messages/:channelId ──────────────────────────────────────────
export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const sender = req.user._id;
    const { text, parentMessageId } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const server = await Server.findById(channel.server);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user.toString() === sender.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this server" });

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Provide some content" });
    }

    let parent = null;
    if (parentMessageId) {
      parent = await Message.findOne({ _id: parentMessageId, channel: channel._id });
      if (!parent) return res.status(404).json({ message: "Parent message not found" });
    }

    const message = await Message.create({
      channel: channel._id,
      server: channel.server,
      sender,
      text,
      parentMessageId: parent ? parent._id : null,
    });

    await message.populate("sender", "username profilePic");

    if (parent) {
      await Message.findByIdAndUpdate(parent._id, { $inc: { replyCount: 1 } });
      io.to(`channel:${channel._id}`).emit("new-thread-reply", message);
    } else {
      io.to(`channel:${channel._id}`).emit("new-message", message);
      attachProblemMetadata(message, text, `channel:${channel._id}`);
    }

    return res.status(201).json({ data: message, message: "Success" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/messages/thread/:messageId ────────────────────────────────────
export const getThreadReplies = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const parent = await Message.findById(messageId);
    if (!parent) return res.status(404).json({ message: "Message not found" });

    const server = await Server.findById(parent.server);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this server" });

    const replies = await Message.find({ parentMessageId: messageId })
      .sort({ createdAt: 1 })
      .populate("sender", "username profilePic");

    return res.status(200).json({ data: replies });
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
      .populate("sender", "username profilePic");

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

    let canDelete = message.sender.toString() === userId.toString();

    if (!canDelete && message.server) {
      const server = await Server.findById(message.server);
      if (server) {
        const member = server.members.find((m) => m.user.toString() === userId.toString());
        canDelete = member && member.role === "owner";
      }
    }

    if (!canDelete) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    io.to(`channel:${message.channel}`).emit("message-deleted", messageId);

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

    io.to(`channel:${message.channel}`).emit("message-edited", {
      messageId: message._id,
      text: message.text,
      edited: true,
    });

    return res.status(200).json({ data: message });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

