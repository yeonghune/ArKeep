import { clearSession, getStoredSession, saveSession } from "./session";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/backend";

function localizeApiMessage(message: string): string {
  const map: Record<string, string> = {
    "Article already saved": "이미 저장한 아티클입니다.",
    "Article not found": "아티클을 찾을 수 없습니다.",
    "Invalid request body": "요청 본문 형식이 올바르지 않습니다.",
    "Invalid request parameter": "요청 파라미터가 올바르지 않습니다.",
    "isRead is required": "읽음 상태 값이 필요합니다.",
    "URL must start with http:// or https://": "URL은 http:// 또는 https://로 시작해야 합니다.",
    "Authentication required": "로그인이 필요합니다.",
    "Invalid refresh token": "세션이 만료되었습니다. 다시 로그인해 주세요.",
    "Refresh token reuse detected": "세션이 만료되었습니다. 다시 로그인해 주세요.",
    "Unexpected server error": "예기치 않은 서버 오류가 발생했습니다."
  };

  return map[message] ?? message;
}

type AuthRefreshResponse = {
  token: string;
  email: string;
};

type ApiErrorPayload = {
  code?: string;
  message?: string;
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<void> | null = null;
let bootstrapRefreshAttempted = false;

async function refreshAccessToken(): Promise<void> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      clearSession();
      throw new ApiRequestError("Session expired. Please log in again.", response.status, "UNAUTHORIZED");
    }

    const payload = (await response.json()) as AuthRefreshResponse;
    const current = getStoredSession();
    saveSession({
      token: payload.token,
      email: payload.email,
      name: current?.name,
      pictureUrl: current?.pictureUrl
    });
  })();

  try {
    await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function requestApi<T>(path: string, opts: RequestInit = {}, token?: string, canRetry = true): Promise<T> {
  let sessionToken = token ?? getStoredSession()?.token;

  const shouldBootstrapRefresh =
    canRetry &&
    !sessionToken &&
    !bootstrapRefreshAttempted &&
    path !== "/auth/google" &&
    path !== "/auth/refresh" &&
    path !== "/auth/logout" &&
    path !== "/metadata/preview";

  if (shouldBootstrapRefresh) {
    bootstrapRefreshAttempted = true;
    try {
      await refreshAccessToken();
      sessionToken = token ?? getStoredSession()?.token;
    } catch {
      // Guest session: proceed without Authorization header.
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined)
  };

  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    credentials: "include"
  });

  const shouldAttemptRefresh =
    canRetry &&
    response.status === 401 &&
    path !== "/auth/google" &&
    path !== "/auth/refresh" &&
    path !== "/auth/logout" &&
    path !== "/metadata/preview";

  if (shouldAttemptRefresh) {
    await refreshAccessToken();
    return requestApi(path, opts, token, false);
  }

  if (!response.ok) {
    let message = `요청이 실패했습니다. (${response.status})`;
    let code: string | undefined;

    try {
      const payload = (await response.json()) as ApiErrorPayload;
      message = payload.message || message;
      code = payload.code;
    } catch {
      // ignore json parsing errors
    }

    throw new ApiRequestError(localizeApiMessage(message), response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

export async function api<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  return requestApi(path, opts, token, true);
}
