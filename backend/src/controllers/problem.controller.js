import Solve from "../models/solve.model.js";
import User from "../models/user.model.js";
import { getProblem } from "../lib/codeforces.js";
import { findProblemLinks } from "../lib/cfLinks.js";
import { checkOneUser } from "../lib/cfPoller.js";

export const unfurlProblem = async (req, res) => {
  try {
    let contestId = req.body.contestId;
    let index = req.body.index;

    if (req.body.url) {
      const links = findProblemLinks(req.body.url);
      if (!links || links.length === 0) {
        return res.status(404).json({ message: "Problem not found" });
      }
      contestId = links[0].contestId;
      index = links[0].index;
    }

    if (!contestId || !index) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const problem = await getProblem(contestId, index);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    return res.status(200).json({ data: problem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMySolves = async (req, res) => {
  try {
    const solves = await Solve.find({ user: req.user._id });
    const result = [];
    for (let i = 0; i < solves.length; i++) {
      result.push({ contestId: solves[i].contestId, index: solves[i].index });
    }
    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Forces an immediate Codeforces submission check for the current user
// instead of waiting for their turn in the poller's rotation, so a "reload"
// click reflects a just-made AC right away.
export const refreshMySolves = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.codeforcesHandle) {
      return res.status(400).json({ message: "Link a Codeforces handle first" });
    }
    await checkOneUser(user);
    const solves = await Solve.find({ user: req.user._id });
    const result = [];
    for (let i = 0; i < solves.length; i++) {
      result.push({ contestId: solves[i].contestId, index: solves[i].index });
    }
    return res.status(200).json({ data: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
