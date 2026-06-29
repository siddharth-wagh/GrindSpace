import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";
import Server from "../src/models/server.model.js";
import Channel from "../src/models/channel.model.js";
import Contest from "../src/models/contest.model.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

const demoUsers = [
  { username: "tourist", email: "tourist@grindspace.dev", codeforcesHandle: "tourist" },
  { username: "jiangly", email: "jiangly@grindspace.dev", codeforcesHandle: "jiangly" },
  { username: "Benq", email: "benq@grindspace.dev", codeforcesHandle: "Benq" },
  { username: "Radewoosh", email: "radewoosh@grindspace.dev", codeforcesHandle: "Radewoosh" },
  { username: "Um_nik", email: "umnik@grindspace.dev", codeforcesHandle: "Um_nik" },
  { username: "errichto", email: "errichto@grindspace.dev", codeforcesHandle: "errichto" },
  { username: "neal", email: "neal@grindspace.dev", codeforcesHandle: "neal" },
  { username: "ecnerwala", email: "ecnerwala@grindspace.dev", codeforcesHandle: "ecnerwala" },
  { username: "maroonrk", email: "maroonrk@grindspace.dev", codeforcesHandle: "maroonrk" },
  { username: "scott_wu", email: "scottwu@grindspace.dev", codeforcesHandle: "scott_wu" }
];

async function run() {
  if (!mongoUri) {
    console.error("MONGO_URI is not set. Aborting.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected.");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("password123", salt);

  const createdUsers = [];

  for (let i = 0; i < demoUsers.length; i++) {
    const oneUser = demoUsers[i];
    const existing = await User.findOne({ email: oneUser.email });
    if (existing) {
      console.log("Skipping existing user: " + oneUser.email);
      createdUsers.push(existing);
      continue;
    }
    const madeUser = await User.create({
      username: oneUser.username,
      email: oneUser.email,
      password: hashedPassword,
      codeforcesHandle: oneUser.codeforcesHandle,
      status: "online"
    });
    console.log("Created user: " + oneUser.username);
    createdUsers.push(madeUser);
  }

  const owner = createdUsers[0];
  const restMembers = createdUsers.slice(1);

  const serverNames = ["ICPC Grind", "Codeforces Daily", "DSA Bootcamp"];
  const createdServers = [];

  for (let s = 0; s < serverNames.length; s++) {
    const name = serverNames[s];
    let existingServer = await Server.findOne({ name: name });
    if (existingServer) {
      console.log("Skipping existing server: " + name);
      createdServers.push(existingServer);
      continue;
    }

    const memberList = [];
    memberList.push({ user: owner._id, role: "owner" });
    for (let m = 0; m < restMembers.length; m++) {
      memberList.push({ user: restMembers[m]._id, role: "member" });
    }

    const madeServer = await Server.create({
      name: name,
      owner: owner._id,
      members: memberList
    });
    console.log("Created server: " + name);

    const madeChannel = await Channel.create({
      server: madeServer._id,
      type: "text",
      name: "general"
    });
    console.log("Created default channel for: " + name);

    createdServers.push({ serverDoc: madeServer, channelDoc: madeChannel });
  }

  let firstSquad = createdServers[0];
  let firstServerId;
  let firstChannelId;
  if (firstSquad.serverDoc) {
    firstServerId = firstSquad.serverDoc._id;
    firstChannelId = firstSquad.channelDoc._id;
  } else {
    firstServerId = firstSquad._id;
    const fallbackChannel = await Channel.findOne({ server: firstServerId });
    firstChannelId = fallbackChannel ? fallbackChannel._id : null;
  }

  const existingContest = await Contest.findOne({ name: "ICPC Grind Mock #1" });
  if (existingContest) {
    console.log("Skipping existing demo contest.");
  } else {
    const participantIds = createdUsers.map(function (u) {
      return u._id;
    });

    const startTime = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);
    const endTime = new Date(startTime.getTime() + 1000 * 60 * 120);

    await Contest.create({
      server: firstServerId,
      channel: firstChannelId,
      name: "ICPC Grind Mock #1",
      problems: [
        { contestId: 1850, index: "A", name: "To My Critics", rating: 800, label: "A" },
        { contestId: 1850, index: "C", name: "Word on the Paper", rating: 800, label: "B" },
        { contestId: 1850, index: "G", name: "The Morning Star", rating: 1300, label: "C" },
        { contestId: 1849, index: "C", name: "Binary String Copying", rating: 1700, label: "D" }
      ],
      createdBy: owner._id,
      participants: participantIds,
      durationMinutes: 120,
      startTime: startTime,
      endTime: endTime,
      status: "ended"
    });
    console.log("Created ended demo contest in ICPC Grind.");
  }

  console.log("Seed complete. Disconnecting...");
  await mongoose.disconnect();
  console.log("Disconnected.");
  process.exit(0);
}

run().catch(async function (err) {
  console.error("Seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch (e) {
    console.error("Disconnect error:", e);
  }
  process.exit(1);
});
