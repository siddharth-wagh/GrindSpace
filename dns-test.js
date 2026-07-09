import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

import dnsPromises from "node:dns/promises";

try {
  const records = await dnsPromises.resolveSrv(
    "_mongodb._tcp.cluster0.6zmwo.mongodb.net"
  );
  console.log(records);
} catch (err) {
  console.error(err);
}

