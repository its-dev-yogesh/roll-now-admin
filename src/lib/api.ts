/**
 * API client. Nothing is persisted in the browser: the access token lives in memory only, and the
 * refresh token is an httpOnly cookie the API sets on /admin/auth (JavaScript can't read it).
 */
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;

async function send(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(accessToken && { Authorization: `Bearer ${accessToken}` }), ...init.headers },
  });
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(", ") : (body?.message ?? res.statusText);
    throw new ApiError(res.status, message);
  }
  return body as T;
}

/** Exchanges the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= send("/admin/auth/refresh", { method: "POST" })
    .then(async (res) => {
      if (!res.ok) {
        accessToken = null;
        return false;
      }
      accessToken = (await res.json()).accessToken;
      return true;
    })
    .catch(() => false)
    .finally(() => (refreshing = null));
  return refreshing;
}

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const init: RequestInit = { method: options.method ?? "GET", body: options.body === undefined ? undefined : JSON.stringify(options.body) };
  let res = await send(path, init);
  if (res.status === 401 && (await refreshSession())) res = await send(path, init);
  return parse<T>(res);
}

export async function signIn(email: string, password: string) {
  const res = await send("/admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  accessToken = (await parse<{ accessToken: string }>(res)).accessToken;
}

export async function signOut() {
  await send("/admin/auth/logout", { method: "POST" }).catch(() => undefined);
  accessToken = null;
}
