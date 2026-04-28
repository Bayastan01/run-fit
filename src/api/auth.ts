import { api, unwrap } from "./client";
import { saveToken, clearToken } from "@/lib/secure";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  energy?: number;
  factionId: string | null;
  guildId?: string | null;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
  session: { expiresAt: string };
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const data = await unwrap<AuthResponse>(api.post("api/auth/register", { json: input }));
  await saveToken(data.token);
  return data.user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const data = await unwrap<AuthResponse>(api.post("api/auth/login", { json: input }));
  await saveToken(data.token);
  return data.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const data = await unwrap<{ user: AuthUser }>(api.get("api/auth/me"));
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await api.post("api/auth/logout").json().catch(() => {});
  } finally {
    await clearToken();
  }
}
