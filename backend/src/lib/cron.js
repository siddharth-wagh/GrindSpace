import { CronJob } from "cron";
import User from "../models/user.model.js";
import { getUserInfo } from "./codeforces.js";

function wait(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

export function startCronJobs() {
  const dailySyncJob = new CronJob("0 3 * * *", async function () {
    try {
      const users = await User.find({
        codeforcesHandle: { $exists: true, $ne: "" },
      });

      for (let i = 0; i < users.length; i++) {
        const oneUser = users[i];
        try {
          const info = await getUserInfo(oneUser.codeforcesHandle);
          if (info) {
            oneUser.cfRating = info.rating;
            oneUser.cfMaxRating = info.maxRating;
            oneUser.cfRank = info.rank;
            oneUser.cfLastSyncedAt = new Date();
            await oneUser.save();
          }
        } catch (userErr) {
          console.log("Failed to sync user", oneUser.codeforcesHandle, userErr.message);
        }
        await wait(500);
      }
    } catch (jobErr) {
      console.log("Daily Codeforces sync job failed", jobErr.message);
    }
  });

  dailySyncJob.start();
}
