import axiosClient from "./axiosClient";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResp = {
  success: boolean;
  accessToken?: string | null;
  refreshToken?: string | null;
  errorMessage?: string | null;
  // nếu server trả thêm user info bạn có thể thêm vào đây
};

export type RefreshPayload = {
  refreshToken: string;
};

export type LogoutPayload = {
  refreshToken: string;
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId"; // optional, nếu server trả userId

export const setAuthStorage = (accessToken?: string | null, refreshToken?: string | null, userId?: string | null) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
};

export const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const getUserId = () => localStorage.getItem(USER_ID_KEY);

export const authApi = {
  /**
   * Employee login
   * POST /api/Authentication/employee-login
   * body: { email, password }
   */
  employeeLogin: (payload: LoginPayload) =>
    axiosClient.post<LoginResp>("/api/Authentication/employee-login", payload),

  /**
   * Refresh token
   * POST /api/Authentication/refresh-token
   * body: { refreshToken }
   */
  refreshToken: (payload: RefreshPayload) =>
    axiosClient.post<LoginResp>("/api/Authentication/refresh-token", payload),

  /**
   * Logout
   * POST /api/Authentication/logout
   * body: { refreshToken }
   */
  logout: (payload: LogoutPayload) =>
    axiosClient.post<{ success: boolean; errorMessage?: string | null }>("/api/Authentication/logout", payload),
};

export default authApi;
