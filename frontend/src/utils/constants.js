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

// DMs
export const DM_ROUTES = `${HOST}/api/dm`;

// Friends
export const FRIEND_ROUTES = `${HOST}/api/friends`;
