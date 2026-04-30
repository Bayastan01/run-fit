import { api, unwrap } from "./client";
import { saveToken } from "@/lib/secure";
import type { AuthUser } from "@/api/auth";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginWithGoogle(idToken: string, displayName?: string): Promise<AuthUser> {
  const data = await unwrap<AuthResponse>(
    api.post("api/auth/oauth/google", { json: { idToken, displayName } }),
  );
  await saveToken(data.token);
  return data.user;
}

export async function loginWithApple(
  identityToken: string,
  email?: string,
  displayName?: string,
): Promise<AuthUser> {
  const data = await unwrap<AuthResponse>(
    api.post("api/auth/oauth/apple", { json: { identityToken, email, displayName } }),
  );
  await saveToken(data.token);
  return data.user;
}
