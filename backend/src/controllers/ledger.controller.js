import Message from "../models/message.model.js";
import Channel from "../models/channel.model.js";
import Server from "../models/server.model.js";
import Solve from "../models/solve.model.js";
import { getProblem } from "../lib/codeforces.js";
import { findProblemLinks } from "../lib/cfLinks.js";
import { io } from "../../index.js";

export async function attachProblemMetadata(message, text, room) {
  const links = findProblemLinks(text);
  if (links.length === 0) return;

  const link = links[0];
  try {
    const meta = await getProblem(link.contestId, link.index);
    message.problemMetadata = meta || {
      contestId: link.contestId,
      index: link.index,
      name: "",
      rating: null,
      tags: [],
      solvedCount: 0,
      url: `https://codeforces.com/contest/${link.contestId}/problem/${link.index}`,
    };
    await message.save();
    await message.populate("sender", "username profilePic");
    io.to(room).emit("ledger-updated", { message });
  } catch (error) {
    console.log("attach metadata error", error.message);
  }
}

async function buildLedger(messages, serverId) {
  const byKey = new Map();
  for (const m of messages) {
    const p = m.problemMetadata;
    if (!p) continue;
    const key = `${p.contestId}-${p.index}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        contestId: p.contestId,
        index: p.index,
        name: p.name,
        rating: p.rating,
        tags: p.tags || [],
        url: p.url,
        solvedCount: p.solvedCount,
        firstSeenBy: m.sender
          ? { _id: m.sender._id, username: m.sender.username }
          : null,
        firstSeenAt: m.createdAt,
        firstMessageId: m._id,
        mentions: 1,
      });
    } else {
      byKey.get(key).mentions += 1;
    }
  }

  const list = [...byKey.values()];

  const server = await Server.findById(serverId);
  const memberIds = server ? server.members.map((mm) => mm.user) : [];
  const squadSize = memberIds.length;

  for (const item of list) {
    const solves = await Solve.find({
      user: { $in: memberIds },
      contestId: item.contestId,
      index: item.index,
    }).select("user");
    item.solvedBy = solves.map((s) => s.user);
    item.solvedByCount = solves.length;
    item.squadSize = squadSize;
  }

  list.sort((a, b) => new Date(b.firstSeenAt) - new Date(a.firstSeenAt));
  return list;
}

export const getChannelLedger = async (req, res) => {
  try {
    const { channelId } = req.params;
    const channel = await Channel.findById(channelId);
    if (!channel) return res.status(404).json({ message: "Channel not found" });

    const messages = await Message.find({
      channel: channelId,
      problemMetadata: { $ne: null },
    })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });

    const list = await buildLedger(messages, channel.server);
    return res.status(200).json({ data: list });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSquadLedger = async (req, res) => {
  try {
    const { serverId } = req.params;
    const channels = await Channel.find({ server: serverId }).select("_id");
    const channelIds = channels.map((c) => c._id);

    const messages = await Message.find({
      channel: { $in: channelIds },
      problemMetadata: { $ne: null },
    })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });

    const list = await buildLedger(messages, serverId);
    return res.status(200).json({ data: list });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
