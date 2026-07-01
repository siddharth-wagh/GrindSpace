import Redis from "ioredis";

let redisClient = null;
let triedRedis = false;
const localData = new Map();
const localExpiry = new Map();

export function getRedis() {
  if (triedRedis) return redisClient;
  triedRedis = true;
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL);
      redisClient.on("error", (e) => console.log("redis error", e.message));
    } catch (err) {
      console.log("redis init failed", err.message);
      redisClient = null;
    }
  }
  return redisClient;
}

function localClean(key) {
  const exp = localExpiry.get(key);
  if (exp && exp < Date.now()) {
    localData.delete(key);
    localExpiry.delete(key);
  }
}

export async function kvGet(key) {
  const client = getRedis();
  if (client) {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  localClean(key);
  return localData.has(key) ? localData.get(key) : null;
}

export async function kvSet(key, value, ttlSeconds) {
  const client = getRedis();
  if (client) {
    const raw = JSON.stringify(value);
    if (ttlSeconds) await client.set(key, raw, "EX", ttlSeconds);
    else await client.set(key, raw);
    return;
  }
  localData.set(key, value);
  if (ttlSeconds) localExpiry.set(key, Date.now() + ttlSeconds * 1000);
  else localExpiry.delete(key);
}

export async function kvSeen(key, ttlSeconds) {
  const client = getRedis();
  if (client) {
    const added = await client.set(key, "1", "EX", ttlSeconds, "NX");
    return added === null;
  }
  localClean(key);
  if (localData.has(key)) return true;
  localData.set(key, "1");
  localExpiry.set(key, Date.now() + ttlSeconds * 1000);
  return false;
}

export async function kvIncr(key, ttlSeconds) {
  const client = getRedis();
  if (client) {
    const count = await client.incr(key);
    if (count === 1 && ttlSeconds) await client.expire(key, ttlSeconds);
    return count;
  }
  localClean(key);
  const current = (localData.get(key) || 0) + 1;
  localData.set(key, current);
  if (current === 1 && ttlSeconds) {
    localExpiry.set(key, Date.now() + ttlSeconds * 1000);
  }
  return current;
}
