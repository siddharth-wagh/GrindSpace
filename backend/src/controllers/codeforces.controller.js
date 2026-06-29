import { getProblem } from "../lib/codeforces.js";

export const fetchProblemMeta = async (req, res) => {
  try {
    const { contestId, index } = req.params;
    const problem = await getProblem(contestId, index.toUpperCase());
    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }
    return res.status(200).json({ data: problem });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
