export const HOST = import.meta.env.MODE==="development"? import.meta.env.VITE_SERVER_URL:"https://grindspace.onrender.com/";


export const AUTH_ROUTES =`${HOST}/api/auth`;
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signup`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/check`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const LOGOUT_ROUTE= `${AUTH_ROUTES}/logout`;
