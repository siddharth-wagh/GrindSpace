import Contest from "../models/contest.model.js";
import Channel from "../models/channel.model.js";
import Solve from "../models/solve.model.js";
import Server from "../models/server.model.js";
import User from "../models/user.model.js";
import { getProblemsInRange, getAllSubmissions } from "../lib/codeforces.js";
import { io } from "../../index.js";

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

export const getActiveContest = async (req, res) => {
  try {
    const channelId = req.params.channelId;
    const contest = await Contest.findOne({
      channel: channelId,
      status: "running",
    });
    return res.status(200).json({ data: contest });
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
      const submissions = await getAllSubmissions(personUser.codeforcesHandle, 200);

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
          statusText = "AC";
          attemptsCount = wrongBeforeAc + 1;
        } else if (sawAnything) {
          statusText = "WA";
          attemptsCount = wrongBeforeAc;
        } else {
          statusText = "none";
          attemptsCount = 0;
        }

        perProblem.push({
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
        if (entry.status === "AC") {
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

    return res.status(200).json({ data: rows });
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
