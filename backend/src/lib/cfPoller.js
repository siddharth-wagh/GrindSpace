import User from "../models/user.model.js";
import Solve from "../models/solve.model.js";
import { getRecentSubmissions } from "./codeforces.js";
import { kvSeen } from "./kvStore.js";
import { io, contestRoomMembers } from "../../index.js";

const pollInterval = Number(process.env.CF_POLL_INTERVAL_MS) || 5000;

function shortVerdict(raw) {
  if (raw === "OK") return "AC";
  if (raw === "WRONG_ANSWER") return "WA";
  if (raw === "TIME_LIMIT_EXCEEDED") return "TLE";
  if (raw === "RUNTIME_ERROR") return "RE";
  if (raw === "COMPILATION_ERROR") return "CE";
  if (raw === "MEMORY_LIMIT_EXCEEDED") return "MLE";
  return "ATT";
}

async function recordSolve(userId, problem) {
  try {
    await Solve.findOneAndUpdate(
      { user: userId, contestId: problem.contestId, index: problem.index },
      {
        $setOnInsert: {
          name: problem.name || "",
          rating: problem.rating || 0,
          tags: problem.tags || [],
          source: "cf",
          solvedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.log("record solve error", error.message);
  }
}

async function checkOneUser(userId, channelIds) {
  const user = await User.findById(userId);
  if (!user || !user.codeforcesHandle) return;

  const submissions = await getRecentSubmissions(user.codeforcesHandle, 10);
  if (!submissions || submissions.length === 0) return;

  const lastId = user.cfLastSubmissionId || 0;
  let newestId = lastId;
  for (const sub of submissions) {
    if (sub.id > newestId) newestId = sub.id;
  }

  if (lastId === 0) {
    user.cfLastSubmissionId = newestId;
    await user.save();
    return;
  }

  for (const sub of submissions) {
    if (sub.id <= lastId) continue;
    const problem = sub.problem || {};
    const accepted = sub.verdict === "OK";

    if (accepted) {
      await recordSolve(userId, problem);
    }

    for (const channelId of channelIds) {
      const seenKey = `seen:${channelId}:${userId}:${sub.id}`;
      const already = await kvSeen(seenKey, 3600);
      if (already) continue;

      io.to(`channel:${channelId}`).emit("ac-verdict", {
        channelId,
        userId,
        username: user.username,
        handle: user.codeforcesHandle,
        verdict: shortVerdict(sub.verdict),
        accepted,
        problemName: problem.name || "a problem",
        problemIndex: problem.index || "",
        contestId: problem.contestId || null,
        rating: problem.rating || null,
        lang: sub.programmingLanguage || "",
        timeMs: sub.timeConsumedMillis || null,
      });
    }
  }

  if (newestId > lastId) {
    user.cfLastSubmissionId = newestId;
    await user.save();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startCfPoller() {
  setInterval(async () => {
    try {
      const userToChannels = {};
      for (const channelId in contestRoomMembers) {
        const membersSet = contestRoomMembers[channelId];
        if (!membersSet) continue;
        for (const userId of membersSet) {
          if (!userToChannels[userId]) userToChannels[userId] = [];
          userToChannels[userId].push(channelId);
        }
      }

      const userIds = Object.keys(userToChannels);
      for (const userId of userIds) {
        await checkOneUser(userId, userToChannels[userId]);
        await wait(250);
      }
    } catch (error) {
      console.log("cf poller error", error.message);
    }
  }, pollInterval);
}
