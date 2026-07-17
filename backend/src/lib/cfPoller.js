import User from "../models/user.model.js";
import Solve from "../models/solve.model.js";
import { getRecentSubmissions } from "./codeforces.js";
import { kvSeen } from "./kvStore.js";
import { io } from "../../index.js";

const pollInterval = Number(process.env.CF_POLL_INTERVAL_MS) || 5000;
const usersPerTick = Number(process.env.CF_POLL_BATCH_SIZE) || 5;

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

export async function checkOneUser(user) {
  const userId = user._id.toString();

  const submissions = await getRecentSubmissions(user.codeforcesHandle, 10);
  if (!submissions || submissions.length === 0) return;

  const lastId = user.cfLastSubmissionId || 0;
  let newestId = lastId;
  for (const sub of submissions) {
    if (sub.id > newestId) newestId = sub.id;
  }

  if (lastId === 0) {
    // First poll for this user: backfill solves already sitting in their
    // recent submissions instead of silently skipping them, since without
    // this a problem solved before the first poll cycle never gets credited.
    for (const sub of submissions) {
      if (sub.verdict === "OK") {
        await recordSolve(userId, sub.problem || {});
      }
    }
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

    const seenKey = `seen:${userId}:${sub.id}`;
    const already = await kvSeen(seenKey, 3600);
    if (already) continue;

    // Broadcast to a per-user room (joined on "user-online") so the AC
    // toast/verdict reaches the user regardless of which channel is open.
    io.to(`user:${userId}`).emit("ac-verdict", {
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

    io.to(`user:${userId}`).emit("scoreboard-refresh", { userId });
  }

  if (newestId > lastId) {
    user.cfLastSubmissionId = newestId;
    await user.save();
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Polls every user with a linked Codeforces handle on a rotating basis
// (a slice per tick) instead of only users currently sitting in a chat
// channel — a shared problem should get auto-verified even if the user
// closes the tab right after posting it.
let pollCursor = 0;

export function startCfPoller() {
  setInterval(async () => {
    try {
      const users = await User.find({ codeforcesHandle: { $nin: [null, ""] } });
      if (users.length === 0) return;

      for (let i = 0; i < Math.min(usersPerTick, users.length); i++) {
        const user = users[pollCursor % users.length];
        pollCursor += 1;
        try {
          await checkOneUser(user);
        } catch (error) {
          console.log("cf poller user error", error.message);
        }
        await wait(250);
      }
    } catch (error) {
      console.log("cf poller error", error.message);
    }
  }, pollInterval);
}
