export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export type LoginInput = {
  emailAddress: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginTotpInput = {
  emailAddress: string;
  totpToken: string;
};

export type RegisterInput = {
  userName: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
  preferences?: Record<string, unknown> | string;
};

export type AuthResponse = {
  ok?: boolean;
  token?: string;
  renewed?: boolean;
  message?: string;
  [key: string]: unknown;
};

export type UserProfile = {
  id: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email_address: string;
  role: string;
  status: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
};

export type UserProfilePatchInput = {
  user_name?: string;
  first_name?: string;
  last_name?: string;
  email_address?: string;
  preferences?: Record<string, unknown>;
};

export type TotpDisableInput = {
  password?: string;
  totpToken?: string;
  backupCode?: string;
};

const AUTH_TOKEN_KEY = "chordradar.authToken";
const AUTH_EMAIL_KEY = "chordradar.authEmail";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3030";

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: unknown = null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    payload = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    payload = text ? { message: text } : null;
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : response.statusText || "Request failed";

    const error: ApiError = {
      status: response.status,
      message: errorMessage,
      details: payload,
    };

    throw error;
  }

  return payload as T;
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = AuthController.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export const AuthController = {
  baseUrl: API_BASE_URL,

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getEmail(): string | null {
    return localStorage.getItem(AUTH_EMAIL_KEY);
  },

  setEmail(email: string): void {
    localStorage.setItem(AUTH_EMAIL_KEY, email);
  },

  clearSession(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EMAIL_KEY);
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const query = input.rememberMe ? "?remember-me=true" : "";
    const response = await fetch(`${API_BASE_URL}/auth/login${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: input.emailAddress,
        password: input.password,
      }),
    });

    const data = await parseResponse<AuthResponse>(response);

    if (data.token) {
      this.setToken(data.token);
      this.setEmail(input.emailAddress);
    }

    return data;
  },

  async loginTotp(input: LoginTotpInput): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login/totp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: input.emailAddress,
        totp_token: input.totpToken,
      }),
    });

    const data = await parseResponse<AuthResponse>(response);

    if (data.token) {
      this.setToken(data.token);
      this.setEmail(input.emailAddress);
    }

    return data;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_name: input.userName,
        first_name: input.firstName,
        last_name: input.lastName,
        email_address: input.emailAddress,
        password: input.password,
        preferences: input.preferences,
      }),
    });

    return parseResponse<AuthResponse>(response);
  },

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify?token=${encodeURIComponent(token)}`, {
      method: "GET",
    });

    const data = await parseResponse<AuthResponse>(response);

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  },

  async logout(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: authHeaders(),
    });

    const data = await parseResponse<AuthResponse>(response);
    this.clearSession();
    return data;
  },

  async authenticatedFetch(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    if (!token) {
      throw {
        status: 401,
        message: "Not authenticated",
      } as ApiError;
    }

    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(input, {
      ...init,
      headers,
    });
  },

  async totpEnroll(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/totp/enroll`, {
      method: "POST",
      headers: authHeaders(),
    });

    return parseResponse<AuthResponse>(response);
  },

  getTotpQrCodeUrl(): string {
    return `${API_BASE_URL}/auth/totp/qr-code`;
  },

  async totpConfirm(code: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/totp/confirm`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token: code }),
    });

    return parseResponse<AuthResponse>(response);
  },

  async totpDisable(input: string | TotpDisableInput): Promise<AuthResponse> {
    const body = typeof input === "string"
      ? { totp_token: input }
      : {
          ...(input.password ? { password: input.password } : {}),
          ...(input.totpToken ? { totp_token: input.totpToken } : {}),
          ...(input.backupCode ? { backup_code: input.backupCode } : {}),
        };

    const response = await fetch(`${API_BASE_URL}/auth/totp/disable`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    return parseResponse<AuthResponse>(response);
  },

  async getUserByEmail(email: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: authHeaders(),
    });

    return parseResponse<UserProfile>(response);
  },

  async getCurrentUser(): Promise<UserProfile> {
    const email = this.getEmail();
    if (!email) {
      throw {
        status: 401,
        message: "No authenticated email found",
      } as ApiError;
    }

    return this.getUserByEmail(email);
  },

  async updateCurrentUser(input: UserProfilePatchInput): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(input),
    });

    const updated = await parseResponse<UserProfile>(response);
    if (updated.email_address) {
      this.setEmail(updated.email_address);
    }
    return updated;
  },

  async deleteCurrentUser(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      await parseResponse(response);
      return;
    }

    this.clearSession();
  },
};

export default AuthController;
