import Server from "../models/server.model.js";
import User from "../models/user.model.js";
import Solve from "../models/solve.model.js";

export const getSquadLeaderboard = async (req, res) => {
  try {
    const serverId = req.params.serverId;
    const range = req.query.range || "all";

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ message: "Server not found" });
    }

    const memberIds = [];
    for (let i = 0; i < server.members.length; i++) {
      memberIds.push(server.members[i].user);
    }

    const members = await User.find({ _id: { $in: memberIds } }).select(
      "username profilePic cfRating cfRank codeforcesHandle"
    );

    let startWindow = null;
    if (range === "week") {
      startWindow = new Date();
      startWindow.setDate(startWindow.getDate() - 7);
    } else if (range === "month") {
      startWindow = new Date();
      startWindow.setDate(startWindow.getDate() - 30);
    }

    const result = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];

      const filter = { user: member._id };
      if (startWindow) {
        filter.solvedAt = { $gte: startWindow };
      }

      const solves = await Solve.find(filter).select("rating solvedAt");

      let solvedCount = 0;
      let score = 0;
      for (let j = 0; j < solves.length; j++) {
        solvedCount++;
        if (solves[j].rating) {
          score += solves[j].rating;
        }
      }

      const allSolves = await Solve.find({ user: member._id }).select("solvedAt");

      const solvedDays = {};
      for (let j = 0; j < allSolves.length; j++) {
        const when = allSolves[j].solvedAt;
        if (!when) {
          continue;
        }
        const dayKey =
          when.getFullYear() + "-" + when.getMonth() + "-" + when.getDate();
        solvedDays[dayKey] = true;
      }

      let streak = 0;
      const cursor = new Date();
      while (true) {
        const key =
          cursor.getFullYear() + "-" + cursor.getMonth() + "-" + cursor.getDate();
        if (solvedDays[key]) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          break;
        }
      }

      result.push({
        user: member,
        solved: solvedCount,
        score: score,
        streak: streak,
      });
    }

    result.sort((a, b) => b.score - a.score);

    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load leaderboard" });
  }
};
