import Contest from "../models/contest.model.js";
import { startDueContest } from "../controllers/contest.controller.js";

const TICK_MS = Number(process.env.CONTEST_TICK_MS) || 10000;

// Watches for lobby contests whose scheduled start time has arrived and
// auto-starts them (generates unique problems + flips to running).
export function startContestScheduler() {
  setInterval(async () => {
    try {
      const now = new Date();
      const due = await Contest.find({
        status: "lobby",
        scheduledStart: { $lte: now },
      });
      for (let i = 0; i < due.length; i++) {
        await startDueContest(due[i]._id);
      }
    } catch (error) {
      console.log("contest scheduler error", error.message);
    }
  }, TICK_MS);
}
