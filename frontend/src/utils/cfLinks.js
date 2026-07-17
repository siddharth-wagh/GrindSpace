export function detectProblemLinks(text) {
  if (!text) return [];

  const found = [];
  const seen = new Set();

  function collect(regex) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const contestId = Number(match[1]);
      const index = match[2].toUpperCase();
      const key = `${contestId}-${index}`;
      if (!seen.has(key)) {
        seen.add(key);
        found.push({ contestId, index });
      }
    }
  }

  collect(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z][0-9]{0,2})/g);
  collect(/codeforces\.com\/contest\/(\d+)\/problem\/([A-Za-z][0-9]{0,2})/g);
  collect(/codeforces\.com\/gym\/(\d+)\/problem\/([A-Za-z][0-9]{0,2})/g);

  return found;
}

const LANG_SIGNALS = {
  cpp: [
    "#include",
    "int main",
    "using namespace",
    "long long",
    "cin",
    "cout",
    "#define",
    "vector<",
    "scanf",
    "printf",
    "std::",
  ],
  python: [
    "def ",
    "import ",
    "from ",
    "print(",
    "elif ",
    "self.",
    "__name__",
    "range(",
    "len(",
    "None",
    "True",
    "False",
  ],
  java: [
    "public class",
    "public static void main",
    "System.out",
    "private ",
    "extends ",
    "implements ",
    "new ",
    "String[]",
  ],
  javascript: [
    "function ",
    "const ",
    "let ",
    "=>",
    "console.log",
    "require(",
    "export ",
    "async ",
    "await ",
    "null",
    "undefined",
  ],
  c: ["#include", "int main", "printf", "scanf", "malloc", "struct ", "sizeof"],
};

function countSignals(segment, signals) {
  let hits = 0;
  for (const s of signals) {
    if (segment.includes(s)) hits += 1;
  }
  return hits;
}

export function detectLanguage(segment) {
  if (!segment) return "cpp";

  let bestLang = "cpp";
  let bestHits = 0;
  for (const lang of Object.keys(LANG_SIGNALS)) {
    const hits = countSignals(segment, LANG_SIGNALS[lang]);
    if (hits > bestHits) {
      bestHits = hits;
      bestLang = lang;
    }
  }
  return bestLang;
}

export function looksLikeCode(segment) {
  if (!segment) return false;
  const lines = segment.split("\n");
  if (lines.length < 2) return false;

  let bestHits = 0;
  for (const lang of Object.keys(LANG_SIGNALS)) {
    const hits = countSignals(segment, LANG_SIGNALS[lang]);
    if (hits > bestHits) bestHits = hits;
  }

  const hasCodeShape =
    segment.includes(";") ||
    segment.includes("{") ||
    segment.includes(":") ||
    /^\s+\S/m.test(segment);

  return bestHits >= 2 && hasCodeShape;
}
