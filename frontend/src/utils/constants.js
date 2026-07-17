export const HOST = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// Auth
export const AUTH_ROUTES = `${HOST}/api/auth`;
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/check`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;

// Servers
export const SERVER_ROUTES = `${HOST}/api/servers`;
export const CREATE_SERVER = `${SERVER_ROUTES}/create`;
export const GET_MY_SERVERS = `${SERVER_ROUTES}/mine`;
export const DISCOVER_SERVERS = `${SERVER_ROUTES}/discover`;
export const SEARCH_SERVERS = `${SERVER_ROUTES}/search`;

// Channels (serverId is dynamic)
export const getChannelsRoute = (serverId) => `${SERVER_ROUTES}/${serverId}/channels`;

// Messages
export const MESSAGE_ROUTES = `${HOST}/api/messages`;

// Friends
export const FRIEND_ROUTES = `${HOST}/api/friends`;

// Problems (unfurl + auto-verified solves)
export const PROBLEM_ROUTES = `${HOST}/api/problems`;
export const UNFURL_ROUTE = `${PROBLEM_ROUTES}/unfurl`;
export const MY_SOLVES_ROUTE = `${PROBLEM_ROUTES}/mine`;
export const REFRESH_MY_SOLVES_ROUTE = `${PROBLEM_ROUTES}/mine/refresh`;

// Bookmarks (personal saved-question list)
export const BOOKMARK_ROUTES = `${HOST}/api/bookmarks`;
export const ADD_BOOKMARK_ROUTE = `${BOOKMARK_ROUTES}`;
export const MY_BOOKMARKS_ROUTE = `${BOOKMARK_ROUTES}/mine`;
export const getRemoveBookmarkRoute = (contestId, index) =>
  `${BOOKMARK_ROUTES}/${contestId}/${index}`;

// Direct messages (1-to-1)
export const DM_ROUTES = `${HOST}/api/dms`;
export const START_CONVERSATION_ROUTE = `${DM_ROUTES}/start`;
export const MY_CONVERSATIONS_ROUTE = `${DM_ROUTES}/mine`;
export const getDmMessagesRoute = (conversationId) => `${DM_ROUTES}/${conversationId}/messages`;

// Problem Ledger (derived)
export const LEDGER_ROUTES = `${HOST}/api/ledger`;
export const getLedgerRoute = (channelId) => `${LEDGER_ROUTES}/channel/${channelId}`;
export const getSquadLedgerRoute = (serverId) => `${LEDGER_ROUTES}/squad/${serverId}`;

// Leaderboard
export const getLeaderboardRoute = (serverId) =>
  `${HOST}/api/leaderboard/squad/${serverId}`;

// CP analytics
export const getHeatmapRoute = (userId) => `${HOST}/api/cp/heatmap/${userId}`;
export const getCpDashboardRoute = (userId) => `${HOST}/api/cp/dashboard/${userId}`;
export const getStreakRoute = (userId) => `${HOST}/api/cp/streak/${userId}`;

// Virtual contests
export const CONTEST_ROUTES = `${HOST}/api/contests`;
export const CREATE_CONTEST_ROUTE = `${CONTEST_ROUTES}/create`;
export const IMPORT_CF_CONTEST_ROUTE = `${CONTEST_ROUTES}/import-cf`;
export const RANDOM_PROBLEMS_ROUTE = `${CONTEST_ROUTES}/random-problems`;
export const ANNOUNCE_CONTEST_ROUTE = `${CONTEST_ROUTES}/announce`;
export const getJoinContestRoute = (contestId) =>
  `${CONTEST_ROUTES}/${contestId}/join`;
export const getLeaveContestRoute = (contestId) =>
  `${CONTEST_ROUTES}/${contestId}/leave`;
export const getChannelContestRoute = (channelId) =>
  `${CONTEST_ROUTES}/channel/${channelId}/active`;
export const getContestScoreboardRoute = (contestId) =>
  `${CONTEST_ROUTES}/${contestId}/scoreboard`;
export const getEndContestRoute = (contestId) => `${CONTEST_ROUTES}/${contestId}/end`;
export const getUpsolveRoute = (contestId) => `${CONTEST_ROUTES}/${contestId}/upsolve`;

// CP rebrand labels
export const LABELS = {
  server: "Squad",
  servers: "Squads",
  channel: "Contest Room",
  channels: "Contest Rooms",
  voiceChannel: "Pair Debugging Line",
};
