import Solve from "../models/solve.model.js";
import User from "../models/user.model.js";
import { getRatedHistory } from "../lib/codeforces.js";

function toDayString(dateValue) {
  const d = new Date(dateValue);
  const year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let monthStr = "" + month;
  let dayStr = "" + day;
  if (month < 10) monthStr = "0" + month;
  if (day < 10) dayStr = "0" + day;
  return year + "-" + monthStr + "-" + dayStr;
}

export const getHeatmap = async (req, res) => {
  try {
    const userId = req.params.userId;
    const now = new Date();
    const oneYearAgo = new Date(now.getTime());
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const solves = await Solve.find({
      user: userId,
      solvedAt: { $gte: oneYearAgo },
    });

    const dayTotals = [];
    for (let i = 0; i < solves.length; i++) {
      const current = solves[i];
      const dayKey = toDayString(current.solvedAt);
      let rating = current.rating;
      if (!rating) rating = 0;

      let found = false;
      for (let j = 0; j < dayTotals.length; j++) {
        if (dayTotals[j].date === dayKey) {
          dayTotals[j].count = dayTotals[j].count + 1;
          dayTotals[j].ratingSum = dayTotals[j].ratingSum + rating;
          found = true;
          break;
        }
      }
      if (!found) {
        dayTotals.push({ date: dayKey, count: 1, ratingSum: rating });
      }
    }

    return res.status(200).json({ data: dayTotals });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const handle = user.codeforcesHandle || "";
    const rating = user.cfRating || 0;
    const maxRating = user.cfMaxRating || 0;
    const rank = user.cfRank || "";

    const solves = await Solve.find({ user: userId });
    const totalSolved = solves.length;

    const bucketLabels = [
      "800-1000",
      "1000-1200",
      "1200-1400",
      "1400-1600",
      "1600-1800",
      "1800-2000",
      "2000-2200",
      "2200-2400",
      "2400+",
    ];
    const ratingBuckets = [];
    for (let i = 0; i < bucketLabels.length; i++) {
      ratingBuckets.push({ bucket: bucketLabels[i], count: 0 });
    }

    const tagCounts = [];

    for (let i = 0; i < solves.length; i++) {
      const current = solves[i];
      const problemRating = current.rating || 0;

      let bucketName = "";
      if (problemRating >= 800 && problemRating < 1000) bucketName = "800-1000";
      else if (problemRating >= 1000 && problemRating < 1200) bucketName = "1000-1200";
      else if (problemRating >= 1200 && problemRating < 1400) bucketName = "1200-1400";
      else if (problemRating >= 1400 && problemRating < 1600) bucketName = "1400-1600";
      else if (problemRating >= 1600 && problemRating < 1800) bucketName = "1600-1800";
      else if (problemRating >= 1800 && problemRating < 2000) bucketName = "1800-2000";
      else if (problemRating >= 2000 && problemRating < 2200) bucketName = "2000-2200";
      else if (problemRating >= 2200 && problemRating < 2400) bucketName = "2200-2400";
      else if (problemRating >= 2400) bucketName = "2400+";

      if (bucketName !== "") {
        for (let b = 0; b < ratingBuckets.length; b++) {
          if (ratingBuckets[b].bucket === bucketName) {
            ratingBuckets[b].count = ratingBuckets[b].count + 1;
            break;
          }
        }
      }

      const tags = current.tags || [];
      for (let t = 0; t < tags.length; t++) {
        const tagName = tags[t];
        let foundTag = false;
        for (let k = 0; k < tagCounts.length; k++) {
          if (tagCounts[k].tag === tagName) {
            tagCounts[k].count = tagCounts[k].count + 1;
            foundTag = true;
            break;
          }
        }
        if (!foundTag) {
          tagCounts.push({ tag: tagName, count: 1 });
        }
      }
    }

    tagCounts.sort(function (a, b) {
      return b.count - a.count;
    });

    const sortedAscending = [];
    for (let i = 0; i < tagCounts.length; i++) {
      sortedAscending.push(tagCounts[i]);
    }
    sortedAscending.sort(function (a, b) {
      return a.count - b.count;
    });

    const weakestTags = [];
    for (let i = 0; i < sortedAscending.length && i < 5; i++) {
      weakestTags.push(sortedAscending[i].tag);
    }

    const recentContests = [];
    if (handle !== "") {
      const history = await getRatedHistory(handle);
      if (history && history.length > 0) {
        let start = history.length - 8;
        if (start < 0) start = 0;
        for (let i = start; i < history.length; i++) {
          const item = history[i];
          let contestName = item.name;
          if (!contestName) contestName = "Contest " + item.contestId;
          recentContests.push({
            name: contestName,
            rank: item.rank,
            oldRating: item.oldRating,
            newRating: item.newRating,
          });
        }
      }
    }

    return res.status(200).json({
      data: {
        handle: handle,
        rating: rating,
        maxRating: maxRating,
        rank: rank,
        totalSolved: totalSolved,
        ratingBuckets: ratingBuckets,
        tagCounts: tagCounts,
        weakestTags: weakestTags,
        recentContests: recentContests,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getStreak = async (req, res) => {
  try {
    const userId = req.params.userId;
    const solves = await Solve.find({ user: userId });

    const uniqueDays = [];
    for (let i = 0; i < solves.length; i++) {
      const dayKey = toDayString(solves[i].solvedAt);
      let already = false;
      for (let j = 0; j < uniqueDays.length; j++) {
        if (uniqueDays[j] === dayKey) {
          already = true;
          break;
        }
      }
      if (!already) {
        uniqueDays.push(dayKey);
      }
    }

    uniqueDays.sort();

    let best = 0;
    let runLength = 0;
    let previousTime = null;
    const oneDayMillis = 24 * 60 * 60 * 1000;

    for (let i = 0; i < uniqueDays.length; i++) {
      const currentTime = new Date(uniqueDays[i] + "T00:00:00").getTime();
      if (previousTime === null) {
        runLength = 1;
      } else {
        const difference = currentTime - previousTime;
        if (difference === oneDayMillis) {
          runLength = runLength + 1;
        } else {
          runLength = 1;
        }
      }
      if (runLength > best) {
        best = runLength;
      }
      previousTime = currentTime;
    }

    let current = 0;
    if (uniqueDays.length > 0) {
      const today = new Date();
      const todayKey = toDayString(today);
      const yesterday = new Date(today.getTime() - oneDayMillis);
      const yesterdayKey = toDayString(yesterday);

      const lastDay = uniqueDays[uniqueDays.length - 1];
      if (lastDay === todayKey || lastDay === yesterdayKey) {
        current = 1;
        let walkerTime = new Date(lastDay + "T00:00:00").getTime();
        for (let i = uniqueDays.length - 2; i >= 0; i--) {
          const dayTime = new Date(uniqueDays[i] + "T00:00:00").getTime();
          const difference = walkerTime - dayTime;
          if (difference === oneDayMillis) {
            current = current + 1;
            walkerTime = dayTime;
          } else {
            break;
          }
        }
      }
    }

    return res.status(200).json({ data: { current: current, best: best } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
