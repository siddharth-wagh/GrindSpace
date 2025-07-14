import Group from "../models/group.model.js";
import crypto from 'crypto';
import User from "../models/user.model.js"
import { generateGroupToken } from "../lib/util.js";

export const createGroup = async (req, res) => {
  try {
    const { name, description, isPrivate, tags } = req.body;
    const leader = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "empty name" });
    }

    
    
    let joinToken;
    if(isPrivate) {
        joinToken = generateGroupToken();
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
    });

    if (!group) {
      return res.status(400).json({ message: "invalid info" });
    }
    await User.findByIdAndUpdate(leader, {
      $push: { groups: group._id },
    });
    return res.status(200).json({
      data: group,
      message: "Group created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
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
      return res.status(404).json({ message: "group not found" });
    }

    if (!group.members.includes(userId)) {
      await Group.findByIdAndUpdate(groupId, {
        $addToSet: { members: userId }, // avoids duplicates
      });
    }

    
   
    if(group.isPrivate && group.joinToken!==req.body.joinToken) {
        return res.status(404).json({ message: "invalid join token" });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { groups: groupId },
    });

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


export const searchGroup=async(req,res)=>{
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
  }

   catch (error) {
        console.error("Group search failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const makeColeader = async(req,res)=>{
  try {
    const { userId } = req.body;
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    if (!group.members.includes(userId)) {
      return res.status(400).json({ message: "User is not a member of this group" });
    }
    if (group.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group leader can promote co-leaders" });
    }
    if (group.coLeaders.includes(userId)) {
      return res.status(400).json({ message: "User is already a co-leader" });
    }
    group.coLeaders.push(userId);
    await group.save();
    return res.status(200).json({ message: "User promoted to co-leader successfully" });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
}

export const getAllUsersInGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const group = await Group.findById(groupId).populate("members", "username profilePic");
    
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    return res.status(200).json({
      data: group.members,
      message: "Members fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
}