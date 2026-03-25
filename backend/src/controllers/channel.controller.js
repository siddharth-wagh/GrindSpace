import Channel from "../models/channel.model.js";
import Server from "../models/server.model.js";
import Message from "../models/message.model.js";

// Helper: check if user has required role
const checkRole = (server, userId, allowedRoles) => {
  const member = server.members.find((m) => m.user.toString() === userId.toString());
  if (!member) return null;
  return allowedRoles.includes(member.role) ? member : null;
};

// ─── POST /api/servers/:serverId/channels ────────────────────────────────────
export const createChannel = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;
    const { name, type, category, topic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }
    if (!type || !["text", "voice"].includes(type)) {
      return res.status(400).json({ message: "Channel type must be 'text' or 'voice'" });
    }

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (!checkRole(server, userId, ["owner", "admin"])) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get the next position for this category
    const lastChannel = await Channel.findOne({ server: serverId, category: category || null })
      .sort({ position: -1 });
    const position = lastChannel ? lastChannel.position + 1 : 0;

    const channel = await Channel.create({
      server: serverId,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      type,
      category: category || null,
      topic: topic || "",
      position,
    });

    return res.status(201).json({ data: channel, message: "Channel created" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/:serverId/channels ─────────────────────────────────────
export const getChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const channels = await Channel.find({ server: serverId }).sort({ category: 1, position: 1 });

    return res.status(200).json({ data: channels });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/servers/:serverId/channels/:channelId ──────────────────────────
export const updateChannel = async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const userId = req.user._id;
    const { name, topic, category } = req.body;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (!checkRole(server, userId, ["owner", "admin"])) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = {};
    if (name) updates.name = name.trim().toLowerCase().replace(/\s+/g, "-");
    if (topic !== undefined) updates.topic = topic;
    if (category !== undefined) updates.category = category;

    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, server: serverId },
      updates,
      { new: true }
    );

    if (!channel) return res.status(404).json({ message: "Channel not found" });

    return res.status(200).json({ data: channel });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/servers/:serverId/channels/:channelId ───────────────────────
export const deleteChannel = async (req, res) => {
  try {
    const { serverId, channelId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (!checkRole(server, userId, ["owner", "admin"])) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const channel = await Channel.findOne({ _id: channelId, server: serverId });
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    if (channel.isDefault) {
      return res.status(400).json({ message: "Cannot delete the default channel" });
    }

    await Promise.all([
      Message.deleteMany({ channel: channelId }),
      Channel.findByIdAndDelete(channelId),
    ]);

    return res.status(200).json({ message: "Channel deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/servers/:serverId/channels/reorder ─────────────────────────────
export const reorderChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;
    const { order } = req.body; // [{ channelId, position, category }]

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (!checkRole(server, userId, ["owner", "admin"])) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "Order must be an array" });
    }

    const ops = order.map(({ channelId, position, category }) => ({
      updateOne: {
        filter: { _id: channelId, server: serverId },
        update: { $set: { position, category } },
      },
    }));

    await Channel.bulkWrite(ops);

    return res.status(200).json({ message: "Channels reordered" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
