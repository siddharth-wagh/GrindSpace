import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { io } from "../../index.js";
import { attachProblemMetadata } from "./ledger.controller.js";

function sortedPair(userIdA, userIdB) {
  return [userIdA.toString(), userIdB.toString()].sort();
}

export const startOrGetConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }
    if (otherUserId === userId.toString()) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    const [a, b] = sortedPair(userId, otherUserId);

    let conversation = await Conversation.findOne({ participants: { $all: [a, b], $size: 2 } });
    if (!conversation) {
      conversation = await Conversation.create({ participants: [a, b] });
    }
    await conversation.populate("participants", "username profilePic status");

    return res.status(200).json({ data: conversation });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "username profilePic status")
      .sort({ updatedAt: -1 });

    const withLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .select("text createdAt sender");
        return { ...conv.toObject(), lastMessage: lastMessage || null };
      })
    );

    return res.status(200).json({ data: withLastMessage });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { before } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === userId.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: "Not part of this conversation" });

    const query = { conversation: conversationId };
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

export const sendDirectMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const sender = req.user._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Provide some content" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === sender.toString()
    );
    if (!isParticipant) return res.status(403).json({ message: "Not part of this conversation" });

    const message = await Message.create({
      conversation: conversation._id,
      sender,
      text,
    });
    await message.populate("sender", "username profilePic");

    const room = `dm:${conversation._id}`;
    io.to(room).emit("new-dm-message", message);

    attachProblemMetadata(message, text, room);

    return res.status(201).json({ data: message, message: "Success" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
