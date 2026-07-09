import Contest from "../models/contest.model.js";
import Channel from "../models/channel.model.js";
import Solve from "../models/solve.model.js";
import Server from "../models/server.model.js";
import User from "../models/user.model.js";
import {
  getProblemsInRange,
  getAllSubmissions,
  getRecentSubmissions,
  getSolvedSet,
} from "../lib/codeforces.js";
import { io } from "../../index.js";

const PARTICIPANT_FIELDS = "username profilePic codeforcesHandle";

function labelFor(i) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (i < letters.length) return letters[i];
  return String(i + 1);
}

async function populateContest(contestId) {
  return await Contest.findById(contestId)
    .populate("participants", PARTICIPANT_FIELDS)
    .populate("createdBy", "username");
}

export const createContest = async (req, res) => {
  try {
    const channelId = req.body.channelId;
    const name = req.body.name;
    const problems = req.body.problems;
    const durationMinutes = req.body.durationMinutes;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const cleanProblems = [];
    let labelIndex = 0;
    while (labelIndex < problems.length) {
      const p = problems[labelIndex];
      let labelLetter = "";
      if (labelIndex === 0) labelLetter = "A";
      else if (labelIndex === 1) labelLetter = "B";
      else if (labelIndex === 2) labelLetter = "C";
      else if (labelIndex === 3) labelLetter = "D";
      else if (labelIndex === 4) labelLetter = "E";
      else if (labelIndex === 5) labelLetter = "F";
      else if (labelIndex === 6) labelLetter = "G";
      else if (labelIndex === 7) labelLetter = "H";
      else labelLetter = String(labelIndex + 1);
      cleanProblems.push({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        label: labelLetter,
      });
      labelIndex = labelIndex + 1;
    }

    const startMoment = new Date();
    const endMoment = new Date(startMoment.getTime() + durationMinutes * 60 * 1000);

    const contest = await Contest.create({
      server: channel.server,
      channel: channelId,
      name: name,
      problems: cleanProblems,
      createdBy: req.user._id,
      participants: [req.user._id],
      durationMinutes: durationMinutes,
      startTime: startMoment,
      endTime: endMoment,
      status: "running",
    });

    io.to("channel:" + channelId).emit("contest-started", { contest });

    return res.status(200).json({ data: contest });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const importCfContest = async (req, res) => {
  try {
    const channelId = req.body.channelId;
    const cfContestId = req.body.cfContestId;
    const durationMinutes = req.body.durationMinutes;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const standingsUrl =
      "https://codeforces.com/api/contest.standings?contestId=" +
      cfContestId +
      "&from=1&count=1";
    const response = await fetch(standingsUrl);
    const payload = await response.json();

    if (!payload || payload.status !== "OK") {
      return res.status(400).json({ message: "Could not fetch CF contest" });
    }

    const cfProblems = payload.result.problems;
    const contestName = payload.result.contest.name;

    const cleanProblems = [];
    let labelIndex = 0;
    while (labelIndex < cfProblems.length) {
      const p = cfProblems[labelIndex];
      let labelLetter = "";
      if (labelIndex === 0) labelLetter = "A";
      else if (labelIndex === 1) labelLetter = "B";
      else if (labelIndex === 2) labelLetter = "C";
      else if (labelIndex === 3) labelLetter = "D";
      else if (labelIndex === 4) labelLetter = "E";
      else if (labelIndex === 5) labelLetter = "F";
      else if (labelIndex === 6) labelLetter = "G";
      else if (labelIndex === 7) labelLetter = "H";
      else labelLetter = String(labelIndex + 1);
      cleanProblems.push({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        label: labelLetter,
      });
      labelIndex = labelIndex + 1;
    }

    const startMoment = new Date();
    const endMoment = new Date(startMoment.getTime() + durationMinutes * 60 * 1000);

    const contest = await Contest.create({
      server: channel.server,
      channel: channelId,
      name: contestName,
      problems: cleanProblems,
      createdBy: req.user._id,
      participants: [req.user._id],
      durationMinutes: durationMinutes,
      startTime: startMoment,
      endTime: endMoment,
      status: "running",
    });

    io.to("channel:" + channelId).emit("contest-started", { contest });

    return res.status(200).json({ data: contest });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const randomProblems = async (req, res) => {
  try {
    const minRating = req.body.minRating;
    const maxRating = req.body.maxRating;
    const count = req.body.count;

    const pool = await getProblemsInRange(minRating, maxRating);

    const shuffled = [];
    let i = 0;
    while (i < pool.length) {
      shuffled.push(pool[i]);
      i = i + 1;
    }

    let j = shuffled.length - 1;
    while (j > 0) {
      const pick = Math.floor(Math.random() * (j + 1));
      const temp = shuffled[j];
      shuffled[j] = shuffled[pick];
      shuffled[pick] = temp;
      j = j - 1;
    }

    const chosen = [];
    let k = 0;
    while (k < count && k < shuffled.length) {
      chosen.push(shuffled[k]);
      k = k + 1;
    }

    return res.status(200).json({ data: chosen });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Organiser announces a scheduled contest. No problems yet — those are
// generated at start time from the final participant set (see startDueContest).
export const announceContest = async (req, res) => {
  try {
    const {
      channelId,
      name,
      scheduledStart,
      durationMinutes,
      ratingMin,
      ratingMax,
      problemCount,
    } = req.body;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const organiser = await User.findById(req.user._id);
    if (!organiser || !organiser.codeforcesHandle) {
      return res.status(400).json({
        message: "Link your Codeforces handle before organising a contest.",
      });
    }

    const when = new Date(scheduledStart);
    if (isNaN(when.getTime())) {
      return res.status(400).json({ message: "Invalid start time." });
    }

    const minR = Number(ratingMin) || 800;
    const maxR = Number(ratingMax) || 1500;
    if (minR > maxR) {
      return res.status(400).json({ message: "Min rating is above max rating." });
    }

    const contest = await Contest.create({
      server: channel.server,
      channel: channelId,
      name: name || "Virtual Contest",
      problems: [],
      createdBy: req.user._id,
      participants: [req.user._id],
      durationMinutes: Number(durationMinutes) || 120,
      ratingMin: minR,
      ratingMax: maxR,
      problemCount: Number(problemCount) || 5,
      scheduledStart: when,
      status: "lobby",
    });

    const populated = await populateContest(contest._id);
    io.to("channel:" + channelId).emit("contest-announced", { contest: populated });
    return res.status(200).json({ data: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const joinContest = async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    if (contest.status !== "lobby") {
      return res
        .status(400)
        .json({ message: "This contest is no longer open to join." });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.codeforcesHandle) {
      return res
        .status(400)
        .json({ message: "Link your Codeforces handle to join." });
    }

    const already = contest.participants.some(
      (p) => String(p) === String(req.user._id)
    );
    if (!already) {
      contest.participants.push(req.user._id);
      await contest.save();
    }

    const populated = await populateContest(contestId);
    io.to("channel:" + contest.channel).emit("contest-updated", {
      contest: populated,
    });
    return res.status(200).json({ data: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const leaveContest = async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    if (contest.status !== "lobby") {
      return res.status(400).json({ message: "Contest already started." });
    }
    if (String(contest.createdBy) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: "The organiser can't leave their own contest." });
    }

    contest.participants = contest.participants.filter(
      (p) => String(p) !== String(req.user._id)
    );
    await contest.save();

    const populated = await populateContest(contestId);
    io.to("channel:" + contest.channel).emit("contest-updated", {
      contest: populated,
    });
    return res.status(200).json({ data: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Generates unique problems and flips a lobby contest to running. Safe to call
// from both the scheduler and a lazy on-read trigger — the flip is atomic.
export const startDueContest = async (contestId) => {
  const contest = await Contest.findById(contestId);
  if (!contest || contest.status !== "lobby") return contest;

  const solvedUnion = new Set();
  let pIndex = 0;
  while (pIndex < contest.participants.length) {
    const participant = await User.findById(contest.participants[pIndex]);
    if (participant && participant.codeforcesHandle) {
      const set = await getSolvedSet(participant.codeforcesHandle);
      set.forEach((k) => solvedUnion.add(k));
    }
    pIndex = pIndex + 1;
  }

  const pool = await getProblemsInRange(contest.ratingMin, contest.ratingMax);
  const fresh = [];
  let poolIndex = 0;
  while (poolIndex < pool.length) {
    const p = pool[poolIndex];
    const key = p.contestId + "-" + p.index;
    if (!solvedUnion.has(key)) fresh.push(p);
    poolIndex = poolIndex + 1;
  }

  let shuffleIndex = fresh.length - 1;
  while (shuffleIndex > 0) {
    const pick = Math.floor(Math.random() * (shuffleIndex + 1));
    const temp = fresh[shuffleIndex];
    fresh[shuffleIndex] = fresh[pick];
    fresh[pick] = temp;
    shuffleIndex = shuffleIndex - 1;
  }

  const wanted = contest.problemCount || 5;
  const picks = [];
  let takeIndex = 0;
  while (takeIndex < fresh.length && picks.length < wanted) {
    picks.push(fresh[takeIndex]);
    takeIndex = takeIndex + 1;
  }
  picks.sort(function (a, b) {
    return (a.rating || 0) - (b.rating || 0);
  });

  const chosen = [];
  let cIndex = 0;
  while (cIndex < picks.length) {
    const p = picks[cIndex];
    chosen.push({
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating,
      label: labelFor(cIndex),
    });
    cIndex = cIndex + 1;
  }

  const startMoment = new Date();
  const endMoment = new Date(
    startMoment.getTime() + contest.durationMinutes * 60 * 1000
  );

  const started = await Contest.findOneAndUpdate(
    { _id: contest._id, status: "lobby" },
    {
      $set: {
        problems: chosen,
        startTime: startMoment,
        endTime: endMoment,
        status: "running",
      },
    },
    { new: true }
  );

  if (!started) {
    // Someone else already started it — return whatever it is now.
    return await populateContest(contestId);
  }

  const populated = await populateContest(contest._id);
  io.to("channel:" + contest.channel).emit("contest-started", {
    contest: populated,
  });
  return populated;
};

export const getActiveContest = async (req, res) => {
  try {
    const channelId = req.params.channelId;
    let contest = await Contest.findOne({
      channel: channelId,
      status: { $in: ["lobby", "running"] },
    }).sort({ createdAt: -1 });

    // Fallback auto-start in case the scheduler tick hasn't fired yet.
    if (
      contest &&
      contest.status === "lobby" &&
      contest.scheduledStart &&
      new Date(contest.scheduledStart).getTime() <= Date.now()
    ) {
      await startDueContest(contest._id);
    }

    const populated = contest ? await populateContest(contest._id) : null;
    return res.status(200).json({ data: populated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getScoreboard = async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const startSeconds = Math.floor(new Date(contest.startTime).getTime() / 1000);
    const endSeconds = Math.floor(new Date(contest.endTime).getTime() / 1000);

    const handleHolders = [];
    const seenUserIds = [];

    const participantList = contest.participants || [];
    let pIndex = 0;
    while (pIndex < participantList.length) {
      const participantUser = await User.findById(participantList[pIndex]);
      if (participantUser && participantUser.codeforcesHandle) {
        const idStr = String(participantUser._id);
        if (!seenUserIds.includes(idStr)) {
          seenUserIds.push(idStr);
          handleHolders.push(participantUser);
        }
      }
      pIndex = pIndex + 1;
    }

    const server = await Server.findById(contest.server);
    if (server && server.members) {
      let mIndex = 0;
      while (mIndex < server.members.length) {
        const memberUser = await User.findById(server.members[mIndex].user);
        if (memberUser && memberUser.codeforcesHandle) {
          const idStr = String(memberUser._id);
          if (!seenUserIds.includes(idStr)) {
            seenUserIds.push(idStr);
            handleHolders.push(memberUser);
          }
        }
        mIndex = mIndex + 1;
      }
    }

    const rows = [];
    let hIndex = 0;
    while (hIndex < handleHolders.length) {
      const personUser = handleHolders[hIndex];
      const submissions = await getRecentSubmissions(personUser.codeforcesHandle, 500);

      const perProblem = [];
      let probIndex = 0;
      while (probIndex < contest.problems.length) {
        const cp = contest.problems[probIndex];

        let solvedTimeSeconds = -1;
        let wrongBeforeAc = 0;
        let sawAnything = false;

        const ordered = [];
        let sIndex = 0;
        while (sIndex < submissions.length) {
          ordered.push(submissions[sIndex]);
          sIndex = sIndex + 1;
        }
        ordered.sort(function (a, b) {
          return a.creationTimeSeconds - b.creationTimeSeconds;
        });

        let oIndex = 0;
        while (oIndex < ordered.length) {
          const sub = ordered[oIndex];
          const inWindow =
            sub.creationTimeSeconds >= startSeconds &&
            sub.creationTimeSeconds <= endSeconds;
          const sameProblem =
            sub.problem &&
            String(sub.problem.contestId) === String(cp.contestId) &&
            String(sub.problem.index) === String(cp.index);
          if (inWindow && sameProblem) {
            sawAnything = true;
            if (sub.verdict === "OK") {
              if (solvedTimeSeconds === -1) {
                solvedTimeSeconds = sub.creationTimeSeconds;
              }
            } else {
              if (solvedTimeSeconds === -1) {
                wrongBeforeAc = wrongBeforeAc + 1;
              }
            }
          }
          oIndex = oIndex + 1;
        }

        let statusText = "none";
        let attemptsCount = 0;
        if (solvedTimeSeconds !== -1) {
          statusText = "solved";
          attemptsCount = wrongBeforeAc + 1;
        } else if (sawAnything) {
          statusText = "attempted";
          attemptsCount = wrongBeforeAc;
        } else {
          statusText = "none";
          attemptsCount = 0;
        }

        perProblem.push({
          label: cp.label,
          index: cp.index,
          status: statusText,
          attempts: attemptsCount,
          solvedTimeSeconds: solvedTimeSeconds,
          wrongBeforeAc: wrongBeforeAc,
        });

        probIndex = probIndex + 1;
      }

      let solvedCount = 0;
      let penalty = 0;
      let ppIndex = 0;
      while (ppIndex < perProblem.length) {
        const entry = perProblem[ppIndex];
        if (entry.status === "solved") {
          solvedCount = solvedCount + 1;
          const minutesToAc = Math.floor(
            (entry.solvedTimeSeconds - startSeconds) / 60
          );
          penalty = penalty + minutesToAc + 20 * entry.wrongBeforeAc;
        }
        ppIndex = ppIndex + 1;
      }

      const cleanPerProblem = [];
      let cppIndex = 0;
      while (cppIndex < perProblem.length) {
        const e = perProblem[cppIndex];
        cleanPerProblem.push({
          label: e.label,
          index: e.index,
          status: e.status,
          attempts: e.attempts,
        });
        cppIndex = cppIndex + 1;
      }

      rows.push({
        user: {
          _id: personUser._id,
          username: personUser.username,
          profilePic: personUser.profilePic,
          codeforcesHandle: personUser.codeforcesHandle,
        },
        solvedCount: solvedCount,
        penalty: penalty,
        perProblem: cleanPerProblem,
      });

      hIndex = hIndex + 1;
    }

    rows.sort(function (a, b) {
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount;
      }
      return a.penalty - b.penalty;
    });

    const problemColumns = [];
    let colIndex = 0;
    while (colIndex < contest.problems.length) {
      const cp = contest.problems[colIndex];
      problemColumns.push({
        label: cp.label,
        index: cp.index,
        name: cp.name,
        rating: cp.rating,
        contestId: cp.contestId,
        url:
          "https://codeforces.com/contest/" +
          cp.contestId +
          "/problem/" +
          cp.index,
      });
      colIndex = colIndex + 1;
    }

    return res.status(200).json({ data: { problems: problemColumns, rows: rows } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const endContest = async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    contest.status = "ended";
    await contest.save();

    io.to("channel:" + contest.channel).emit("contest-ended", { contestId });

    return res.status(200).json({ data: contest });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getUpsolve = async (req, res) => {
  try {
    const contestId = req.params.contestId;
    const contest = await Contest.findById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    const startSeconds = Math.floor(new Date(contest.startTime).getTime() / 1000);
    const endSeconds = Math.floor(new Date(contest.endTime).getTime() / 1000);

    const me = await User.findById(req.user._id);

    let solvedInWindow = [];
    if (me && me.codeforcesHandle) {
      const submissions = await getAllSubmissions(me.codeforcesHandle, 200);
      let sIndex = 0;
      while (sIndex < submissions.length) {
        const sub = submissions[sIndex];
        const inWindow =
          sub.creationTimeSeconds >= startSeconds &&
          sub.creationTimeSeconds <= endSeconds;
        if (inWindow && sub.verdict === "OK" && sub.problem) {
          solvedInWindow.push(
            String(sub.problem.contestId) + ":" + String(sub.problem.index)
          );
        }
        sIndex = sIndex + 1;
      }
    }

    const result = [];
    let pIndex = 0;
    while (pIndex < contest.problems.length) {
      const cp = contest.problems[pIndex];
      const key = String(cp.contestId) + ":" + String(cp.index);

      let solvedDuringContest = false;
      let wIndex = 0;
      while (wIndex < solvedInWindow.length) {
        if (solvedInWindow[wIndex] === key) {
          solvedDuringContest = true;
        }
        wIndex = wIndex + 1;
      }

      if (!solvedDuringContest) {
        const laterSolve = await Solve.findOne({
          user: req.user._id,
          contestId: cp.contestId,
          index: cp.index,
        });
        let isDone = false;
        if (laterSolve) isDone = true;

        result.push({
          contestId: cp.contestId,
          index: cp.index,
          name: cp.name,
          rating: cp.rating,
          done: isDone,
        });
      }

      pIndex = pIndex + 1;
    }

    return res.status(200).json({ data: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
