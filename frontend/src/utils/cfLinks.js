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

export function looksLikeCode(segment) {
  if (!segment) return false;
  const lines = segment.split("\n");
  if (lines.length < 2) return false;

  const signals = [
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
  ];

  let hits = 0;
  for (const s of signals) {
    if (segment.includes(s)) hits += 1;
  }
  const hasCodeShape = segment.includes(";") || segment.includes("{");
  return hits >= 2 && hasCodeShape;
}
