import Server from "../models/server.model.js";
import Channel from "../models/channel.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import streamifier from "streamifier";
import crypto from "crypto";

const generateInviteCode = () => crypto.randomBytes(4).toString("hex"); // 8 chars

// ─── POST /api/servers/create ────────────────────────────────────────────────
export const createServer = async (req, res) => {
  try {
    const { name, description, isPrivate, tags } = req.body;
    const ownerId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Server name is required" });
    }

    let icon;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "server_icons" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      icon = result.secure_url;
    }

    const inviteCode = generateInviteCode();

    const server = await Server.create({
      name: name.trim(),
      description: description || "",
      icon,
      isPrivate: isPrivate === "true" || isPrivate === true,
      owner: ownerId,
      members: [{ user: ownerId, role: "owner" }],
      inviteCode,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      categories: [{ name: "Text Channels", position: 0 }, { name: "Voice Channels", position: 1 }],
    });

    // Auto-create default channels
    const [generalText, generalVoice] = await Promise.all([
      Channel.create({
        server: server._id,
        name: "general",
        type: "text",
        category: "Text Channels",
        position: 0,
        isDefault: true,
      }),
      Channel.create({
        server: server._id,
        name: "General",
        type: "voice",
        category: "Voice Channels",
        position: 0,
      }),
    ]);

    await User.findByIdAndUpdate(ownerId, {
      $addToSet: { servers: server._id },
    });

    return res.status(201).json({
      data: server,
      channels: [generalText, generalVoice],
      message: "Server created successfully",
    });
  } catch (error) {
    console.error("Error creating server:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/mine ───────────────────────────────────────────────────
export const getMyServers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("servers");
    return res.status(200).json({ data: user.servers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/discover ───────────────────────────────────────────────
export const discoverServers = async (req, res) => {
  try {
    const { query = "", page = 1, limit = 20 } = req.query;
    const filter = { isPrivate: false };
    if (query.trim()) {
      filter.name = { $regex: new RegExp(query, "i") };
    }

    const servers = await Server.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("name description icon members tags");

    return res.status(200).json({ data: servers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/search ─────────────────────────────────────────────────
export const searchServers = async (req, res) => {
  try {
    const { query = "" } = req.query;
    if (!query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    const servers = await Server.find({
      name: { $regex: new RegExp(query, "i") },
    })
      .limit(10)
      .select("name description icon isPrivate members tags");

    return res.status(200).json({ data: servers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/:serverId ──────────────────────────────────────────────
export const getServer = async (req, res) => {
  try {
    const server = await Server.findById(req.params.serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    return res.status(200).json({ data: server });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/servers/:serverId ──────────────────────────────────────────────
export const updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;
    const { name, description, isPrivate, tags } = req.body;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const member = server.members.find((m) => m.user.toString() === userId.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate === "true" || isPrivate === true;
    if (tags) updates.tags = Array.isArray(tags) ? tags : [tags];

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "server_icons" },
          (err, result) => (err ? reject(err) : resolve(result))
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
      updates.icon = result.secure_url;
    }

    const updated = await Server.findByIdAndUpdate(serverId, updates, { new: true });
    return res.status(200).json({ data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/servers/:serverId ───────────────────────────────────────────
export const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (server.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the owner can delete this server" });
    }

    const memberUserIds = server.members.map((m) => m.user);

    // Remove server from all members' server lists
    await User.updateMany(
      { _id: { $in: memberUserIds } },
      { $pull: { servers: serverId } }
    );

    // Delete all channels and messages
    const channels = await Channel.find({ server: serverId }).select("_id");
    const channelIds = channels.map((c) => c._id);

    await Promise.all([
      Message.deleteMany({ channel: { $in: channelIds } }),
      Channel.deleteMany({ server: serverId }),
      Server.findByIdAndDelete(serverId),
    ]);

    return res.status(200).json({ message: "Server deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/servers/:serverId/join ────────────────────────────────────────
export const joinServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;
    const { inviteCode } = req.body;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    // Check if already a member
    if (server.members.some((m) => m.user.toString() === userId.toString())) {
      return res.status(200).json({ data: server, message: "Already a member" });
    }

    // Private servers require invite code
    if (server.isPrivate) {
      if (!inviteCode || server.inviteCode !== inviteCode) {
        return res.status(403).json({ message: "Invalid invite code" });
      }
    }

    await Promise.all([
      Server.findByIdAndUpdate(serverId, {
        $push: { members: { user: userId, role: "member" } },
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { servers: serverId },
      }),
    ]);

    return res.status(200).json({ message: "Joined server successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/servers/:serverId/leave ───────────────────────────────────────
export const leaveServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    if (server.owner.toString() === userId.toString()) {
      return res.status(400).json({ message: "Owner cannot leave. Delete the server instead." });
    }

    const isMember = server.members.some((m) => m.user.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ message: "Not a member of this server" });
    }

    await Promise.all([
      Server.findByIdAndUpdate(serverId, {
        $pull: { members: { user: userId } },
      }),
      User.findByIdAndUpdate(userId, {
        $pull: { servers: serverId },
      }),
    ]);

    return res.status(200).json({ message: "Left the server successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/:serverId/members ──────────────────────────────────────
export const getServerMembers = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId).populate(
      "members.user",
      "username profilePic status"
    );
    if (!server) return res.status(404).json({ message: "Server not found" });

    const isMember = server.members.some((m) => m.user._id.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    return res.status(200).json({
      members: server.members,
      ownerId: server.owner,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── PUT /api/servers/:serverId/members/:userId/role ─────────────────────────
export const changeMemberRole = async (req, res) => {
  try {
    const { serverId, userId: targetId } = req.params;
    const requesterId = req.user._id;
    const { role } = req.body;

    if (!["admin", "moderator", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const requester = server.members.find((m) => m.user.toString() === requesterId.toString());
    if (!requester || !["owner", "admin"].includes(requester.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Can't change owner's role
    if (server.owner.toString() === targetId) {
      return res.status(400).json({ message: "Cannot change owner's role" });
    }

    // Admins can only set moderator/member, not other admins
    if (requester.role === "admin" && role === "admin") {
      return res.status(403).json({ message: "Only the owner can promote to admin" });
    }

    const updated = await Server.findOneAndUpdate(
      { _id: serverId, "members.user": targetId },
      { $set: { "members.$.role": role } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Member not found" });

    return res.status(200).json({ message: "Role updated", data: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/servers/:serverId/members/:userId ───────────────────────────
export const kickMember = async (req, res) => {
  try {
    const { serverId, userId: targetId } = req.params;
    const requesterId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const requester = server.members.find((m) => m.user.toString() === requesterId.toString());
    if (!requester || !["owner", "admin", "moderator"].includes(requester.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (server.owner.toString() === targetId) {
      return res.status(400).json({ message: "Cannot kick the owner" });
    }

    // Moderators can only kick members, not admins
    const target = server.members.find((m) => m.user.toString() === targetId);
    if (!target) return res.status(404).json({ message: "Member not found" });

    if (requester.role === "moderator" && target.role !== "member") {
      return res.status(403).json({ message: "Moderators can only kick members" });
    }
    if (requester.role === "admin" && target.role === "admin") {
      return res.status(403).json({ message: "Admins cannot kick other admins" });
    }

    await Promise.all([
      Server.findByIdAndUpdate(serverId, {
        $pull: { members: { user: targetId } },
      }),
      User.findByIdAndUpdate(targetId, {
        $pull: { servers: serverId },
      }),
    ]);

    return res.status(200).json({ message: "Member kicked" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/servers/:serverId/invite ──────────────────────────────────────
export const generateInvite = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    const server = await Server.findById(serverId);
    if (!server) return res.status(404).json({ message: "Server not found" });

    const member = server.members.find((m) => m.user.toString() === userId.toString());
    if (!member || !["owner", "admin"].includes(member.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newCode = generateInviteCode();
    server.inviteCode = newCode;
    await server.save();

    return res.status(200).json({ inviteCode: newCode });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/servers/join-by-code/:inviteCode ───────────────────────────────
export const joinByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    const server = await Server.findOne({ inviteCode });
    if (!server) return res.status(404).json({ message: "Invalid invite code" });

    if (server.members.some((m) => m.user.toString() === userId.toString())) {
      return res.status(200).json({ data: server, message: "Already a member" });
    }

    await Promise.all([
      Server.findByIdAndUpdate(server._id, {
        $push: { members: { user: userId, role: "member" } },
      }),
      User.findByIdAndUpdate(userId, {
        $addToSet: { servers: server._id },
      }),
    ]);

    return res.status(200).json({ data: server, message: "Joined server successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
