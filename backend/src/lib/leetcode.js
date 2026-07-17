const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

export async function getLeetCodeUserInfo(handle) {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query getUser($username: String!) {
          matchedUser(username: $username) {
            username
          }
        }`,
        variables: { username: handle },
      }),
    });
    const data = await res.json();
    if (!data || !data.data || !data.data.matchedUser) return null;
    return { username: data.data.matchedUser.username };
  } catch (error) {
    return null;
  }
}
