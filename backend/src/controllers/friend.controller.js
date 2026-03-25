import User from "../models/user.model.js";
import { io, userSocketMap } from "../../index.js";

// ─── POST /api/friends/request/:userId ──────────────────────────────────────
export const sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { userId: targetId } = req.params;

    if (senderId.toString() === targetId) {
      return res.status(400).json({ message: "Cannot send friend request to yourself" });
    }

    const [sender, target] = await Promise.all([
      User.findById(senderId),
      User.findById(targetId),
    ]);

    if (!target) return res.status(404).json({ message: "User not found" });

    // Already friends
    if (sender.friends.some((f) => f.toString() === targetId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Already sent request
    if (sender.friendRequests.outgoing.some((f) => f.toString() === targetId)) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // If target already sent us a request, auto-accept
    if (sender.friendRequests.incoming.some((f) => f.toString() === targetId)) {
      await Promise.all([
        User.findByIdAndUpdate(senderId, {
          $addToSet: { friends: targetId },
          $pull: { "friendRequests.incoming": targetId },
        }),
        User.findByIdAndUpdate(targetId, {
          $addToSet: { friends: senderId },
          $pull: { "friendRequests.outgoing": senderId },
        }),
      ]);

      // Notify both users
      notifyUser(targetId, "friend-request-accepted", { userId: senderId.toString() });
      return res.status(200).json({ message: "Friend request auto-accepted (mutual request)" });
    }

    await Promise.all([
      User.findByIdAndUpdate(senderId, {
        $addToSet: { "friendRequests.outgoing": targetId },
      }),
      User.findByIdAndUpdate(targetId, {
        $addToSet: { "friendRequests.incoming": senderId },
      }),
    ]);

    // Real-time notification
    const senderData = { _id: senderId, username: sender.username, profilePic: sender.profilePic };
    notifyUser(targetId, "friend-request-received", senderData);

    return res.status(200).json({ message: "Friend request sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/friends/accept/:userId ───────────────────────────────────────
export const acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: senderId } = req.params;

    const user = await User.findById(userId);
    if (!user.friendRequests.incoming.some((f) => f.toString() === senderId)) {
      return res.status(400).json({ message: "No pending request from this user" });
    }

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { friends: senderId },
        $pull: { "friendRequests.incoming": senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $addToSet: { friends: userId },
        $pull: { "friendRequests.outgoing": userId },
      }),
    ]);

    notifyUser(senderId, "friend-request-accepted", { userId: userId.toString() });

    return res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── POST /api/friends/decline/:userId ──────────────────────────────────────
export const declineFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: senderId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { "friendRequests.incoming": senderId },
      }),
      User.findByIdAndUpdate(senderId, {
        $pull: { "friendRequests.outgoing": userId },
      }),
    ]);

    return res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── DELETE /api/friends/:userId ────────────────────────────────────────────
export const removeFriend = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: friendId } = req.params;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } }),
    ]);

    notifyUser(friendId, "friend-removed", { userId: userId.toString() });

    return res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/friends ───────────────────────────────────────────────────────
export const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username profilePic status"
    );

    return res.status(200).json({ data: user.friends });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/friends/requests ──────────────────────────────────────────────
export const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friendRequests.incoming", "username profilePic")
      .populate("friendRequests.outgoing", "username profilePic");

    return res.status(200).json({
      incoming: user.friendRequests.incoming,
      outgoing: user.friendRequests.outgoing,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ─── GET /api/friends/search ────────────────────────────────────────────────
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: "Query is required" });
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      username: { $regex: new RegExp(query, "i") },
    })
      .limit(10)
      .select("username profilePic status");

    return res.status(200).json({ data: users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Helper: send socket event to a specific user
function notifyUser(userId, event, data) {
  for (const [socketId, uid] of Object.entries(userSocketMap)) {
    if (uid === userId.toString()) {
      io.to(socketId).emit(event, data);
    }
  }
}
