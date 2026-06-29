import { getModel } from "../lib/gemini.js";

export async function askOracle(req, res) {
  try {
    const model = getModel();
    if (!model) {
      return res.status(503).json({ message: "Oracle is not configured. Add GEMINI_API_KEY." });
    }

    const code = req.body.code;
    const mode = req.body.mode;
    const expected = req.body.expected;
    const actual = req.body.actual;
    const spoiler = req.body.spoiler;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ message: "Code is required" });
    }

    let prompt = "";

    if (mode === "complexity") {
      prompt = "You are a competitive programming mentor. Analyze the time and space complexity of the following code and state clearly whether it is fast enough for typical contest constraints. Keep your answer under 90 words.\n\nCode:\n" + code;
    } else if (mode === "bug") {
      let expectedText = "not provided";
      if (expected) {
        expectedText = expected;
      }
      let actualText = "not provided";
      if (actual) {
        actualText = actual;
      }
      prompt = "You are a competitive programming mentor. The following code is producing wrong results. Find the most likely bug and explain it briefly. Do not rewrite the whole solution, just point to the problem and how to fix it.\n\nExpected output:\n" + expectedText + "\n\nActual output:\n" + actualText + "\n\nCode:\n" + code;
    } else if (mode === "approach") {
      if (spoiler === true) {
        prompt = "You are a competitive programming mentor. Based on the following code attempt, explain a full approach to solve this problem, including the key idea and the steps to implement it.\n\nCode:\n" + code;
      } else {
        prompt = "You are a competitive programming mentor. Based on the following code attempt, give only a small nudge or hint toward the right approach. Do not reveal the full solution.\n\nCode:\n" + code;
      }
    } else {
      return res.status(400).json({ message: "Invalid mode" });
    }

    const result = await model.generateContent(prompt);

    return res.status(200).json({ data: { answer: result.response.text(), mode } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
