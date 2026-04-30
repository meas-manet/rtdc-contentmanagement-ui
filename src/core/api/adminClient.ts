import axios from "axios";

// Use relative URL — Vite dev proxy forwards /api to localhost:5091
const BASE_URL = "";

// ── Admin client ──────────────────────────────────────────────────────────
// withCredentials is required so the browser forwards the httpOnly
// refresh_token cookie on /api/auth/refresh requests.
export const adminClient = axios.create({ baseURL: BASE_URL, withCredentials: true });

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Silent refresh ────────────────────────────────────────────────────────
// When the server returns 401, attempt one silent refresh via the httpOnly
// cookie.  While refreshing, queue any other failing requests so they are
// replayed with the new token instead of triggering a redirect cascade.

let isRefreshing = false;
type QueueEntry = { resolve: (token: string) => void; reject: (err: unknown) => void };
let queue: QueueEntry[] = [];

function flushQueue(error: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)));
  queue = [];
}

adminClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean };

    // Only attempt refresh for 401s on non-refresh endpoints
    if (
      err.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/api/auth/refresh")
    ) {
      if (isRefreshing) {
        // Park this request until the in-flight refresh completes
        return new Promise<string>((resolve, reject) =>
          queue.push({ resolve, reject }),
        ).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return adminClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{ accessToken: string }>(
          "/api/auth/refresh",
          null,
          { withCredentials: true },
        );
        const newToken = data.accessToken;
        localStorage.setItem("jwt", newToken);
        adminClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        flushQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return adminClient(original);
      } catch (refreshErr) {
        flushQueue(refreshErr, null);
        localStorage.removeItem("jwt");
        window.location.href = "/login";
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);
