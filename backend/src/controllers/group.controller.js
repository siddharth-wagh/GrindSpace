import Group from "../models/group.model.js";
import crypto from 'crypto';
import User from "../models/user.model.js"
import Message from "../models/message.model.js";
import { generateGroupToken } from "../lib/util.js";
import cloudinary from "../lib/cloudinary.js";
import streamifier from 'streamifier';

export const createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, tags } = req.body;
    const leader = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    let joinToken;
    if (isPrivate) {
      joinToken = generateGroupToken();
    }

    let profilePicGrp =
      "https://img.freepik.com/free-vector/user-group-with-shadow_78370-7019.jpg?semt=ais_hybrid&w=740"; // Default

    // Upload image if provided
    if (req.file) {
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "group_images" },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req.file.buffer);
      profilePicGrp = result.secure_url;
    }

    const group = await Group.create({
      name,
      description,
      tags,
      leader,
      coLeaders: [],
      members: [leader],
      joinToken,
      isPrivate,
      jitsiRoomName: `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      profilePicGrp,
    });

    await User.findByIdAndUpdate(leader, {
      $push: { groups: group._id },
    });

    return res.status(200).json({
      data: group,
      message: "Group created successfully",
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({ message: error.message, success: false });
  }
};

export const getAllGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const userWithGroups = await User.findById(userId).populate("groups");

    if (!userWithGroups) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      data: userWithGroups.groups,
      message: "Group fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const groupId = req.params.groupId;

    const group = await Group.findById(groupId).select("+joinToken");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // ✅ Validate token BEFORE modifying anything (security fix)
    if (group.isPrivate && group.joinToken !== req.body.joinToken) {
      return res.status(403).json({ message: "Invalid join token" });
    }

    // Already a member — no-op
    if (group.members.includes(userId)) {
      return res.status(200).json({ data: true, message: "Already a member" });
    }

    // Add user to group members and user's group list atomically
    await Promise.all([
      Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } }),
      User.findByIdAndUpdate(userId, { $addToSet: { groups: groupId } }),
    ]);

    return res.status(200).json({
      data: true,
      message: "Group joined successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};


export const searchGroup = async (req, res) => {
  const { query = "", full } = req.query;

  if (!query.trim()) {
    return res.status(400).json({ error: "Query string is required." });
  }
  try {

    const searchRegex = new RegExp(query, "i");

    const matchedGroups = await Group.find({
      name: { $regex: searchRegex },
    })
      .limit(full === "true" ? 0 : 10) // 10 for suggestions, unlimited for full results
      .select("name description isPrivate tags"); // keep it lightweight

    res.status(200).json(matchedGroups);
  } catch (error) {
    console.error("Group search failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/group/:groupId/members ─────────────────────────────────────────
export const getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).populate(
      "members",
      "username profilePic status"
    ).populate("leader", "_id");

    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only members can fetch the member list
    const isMember = group.members.some((m) => m._id.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    return res.status(200).json({
      members: group.members,
      leaderId: group.leader?._id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/group/:groupId/token  (leader only) ────────────────────────────
export const getGroupToken = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId).select("+joinToken");
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the group leader can view the token" });
    }

    if (!group.isPrivate) {
      return res.status(400).json({ message: "This group is public — no token needed" });
    }

    return res.status(200).json({ joinToken: group.joinToken });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/group/leave/:groupId ──────────────────────────────────────────
export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    console.log("[leaveGroup] groupId:", groupId, "userId:", userId.toString());

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    console.log("[leaveGroup] members:", group.members.map(m => m.toString()));
    console.log("[leaveGroup] leader:", group.leader.toString());

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    const isLeader = group.leader.toString() === userId.toString();

    console.log("[leaveGroup] isMember:", isMember, "isLeader:", isLeader);

    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    // Leader cannot leave — they must delete the group
    if (isLeader) {
      return res.status(400).json({ message: "Leaders cannot leave. Delete the group instead." });
    }

    await Promise.all([
      Group.findByIdAndUpdate(groupId, { $pull: { members: userId } }),
      User.findByIdAndUpdate(userId, { $pull: { groups: groupId } }),
    ]);

    return res.status(200).json({ message: "Left the group successfully" });
  } catch (error) {
    console.error("[leaveGroup] error:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/group/delete/:groupId  (leader only) ────────────────────────
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.leader.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the leader can delete this group" });
    }

    // Remove group from all members' group lists
    await User.updateMany(
      { _id: { $in: group.members } },
      { $pull: { groups: groupId } }
    );

    // Delete all messages in the group
    await Message.deleteMany({ group: groupId });

    // Delete the group itself
    await Group.findByIdAndDelete(groupId);

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

