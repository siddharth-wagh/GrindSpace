import { kvGet, kvSet } from "./kvStore.js";

const CF_BASE = process.env.CF_API_BASE || "https://codeforces.com/api";

let savedProblems = new Map();
let lastLoaded = 0;
const oneHour = 60 * 60 * 1000;

async function callCf(path) {
  const res = await fetch(`${CF_BASE}/${path}`);
  const data = await res.json();
  return data;
}

async function loadAllProblems() {
  const now = Date.now();
  if (savedProblems.size > 0 && now - lastLoaded < oneHour) return;

  const data = await callCf("problemset.problems");
  if (data.status !== "OK") return;

  const solvedByKey = new Map();
  const stats = data.result.problemStatistics || [];
  for (const s of stats) {
    solvedByKey.set(`${s.contestId}-${s.index}`, s.solvedCount);
  }

  const fresh = new Map();
  for (const p of data.result.problems) {
    if (p.contestId == null || p.index == null) continue;
    const key = `${p.contestId}-${p.index}`;
    fresh.set(key, {
      contestId: p.contestId,
      index: p.index,
      name: p.name,
      rating: p.rating || null,
      tags: p.tags || [],
      solvedCount: solvedByKey.get(key) || 0,
    });
  }

  if (fresh.size > 0) {
    savedProblems = fresh;
    lastLoaded = now;
  }
}

export async function getProblem(contestId, index) {
  await loadAllProblems();
  const found = savedProblems.get(`${contestId}-${index}`);
  if (!found) return null;
  return {
    contestId: found.contestId,
    index: found.index,
    name: found.name,
    rating: found.rating,
    tags: found.tags,
    solvedCount: found.solvedCount,
    url: `https://codeforces.com/contest/${contestId}/problem/${index}`,
  };
}

export async function getProblemsInRange(minRating, maxRating) {
  await loadAllProblems();
  const result = [];
  for (const p of savedProblems.values()) {
    if (!p.rating) continue;
    if (p.rating >= minRating && p.rating <= maxRating) {
      result.push({
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags,
      });
    }
  }
  return result;
}

export async function getRecentSubmissions(handle, count) {
  const data = await callCf(
    `user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`
  );
  if (data.status !== "OK") return [];
  return data.result;
}

export async function getUserInfo(handle) {
  const key = `cf:userinfo:${handle.toLowerCase()}`;
  const cached = await kvGet(key);
  if (cached) return cached;

  const data = await callCf(`user.info?handles=${encodeURIComponent(handle)}`);
  if (data.status !== "OK" || !data.result || data.result.length === 0) return null;

  const info = data.result[0];
  const trimmed = {
    handle: info.handle,
    rating: info.rating || 0,
    maxRating: info.maxRating || 0,
    rank: info.rank || "unrated",
  };
  await kvSet(key, trimmed, 60 * 60);
  return trimmed;
}

export async function getRatedHistory(handle) {
  const key = `cf:rating:${handle.toLowerCase()}`;
  const cached = await kvGet(key);
  if (cached) return cached;

  const data = await callCf(`user.rating?handle=${encodeURIComponent(handle)}`);
  if (data.status !== "OK") return [];
  await kvSet(key, data.result, 60 * 60);
  return data.result;
}

// Full set of problems a handle has ever solved ("contestId-index" keys).
// Used to pick contest problems nobody in the lobby has already solved.
export async function getSolvedSet(handle) {
  const key = `cf:solvedset:${handle.toLowerCase()}`;
  const cached = await kvGet(key);
  if (cached) return new Set(cached);

  const data = await callCf(
    `user.status?handle=${encodeURIComponent(handle)}&from=1&count=100000`
  );
  if (data.status !== "OK") return new Set();

  const solved = new Set();
  for (const sub of data.result) {
    if (sub.verdict === "OK" && sub.problem && sub.problem.contestId != null) {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  await kvSet(key, Array.from(solved), 10 * 60);
  return solved;
}

export async function getAllSubmissions(handle, count) {
  const key = `cf:subs:${handle.toLowerCase()}:${count}`;
  const cached = await kvGet(key);
  if (cached) return cached;

  const data = await callCf(
    `user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`
  );
  if (data.status !== "OK") return [];
  await kvSet(key, data.result, 5 * 60);
  return data.result;
}
