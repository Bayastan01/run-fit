import ky, { type KyInstance } from "ky";
import { env } from "@/lib/env";
import { loadToken, clearToken } from "@/lib/secure";

export class ApiError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api: KyInstance = ky.create({
  prefixUrl: env.apiUrl,
  timeout: 15000,
  retry: { limit: 2, methods: ["get"] },
  hooks: {
    beforeRequest: [
      async (request) => {
        const token = await loadToken();
        if (token) request.headers.set("authorization", `Bearer ${token}`);
      },
    ],
    afterResponse: [
      async (_req, _opts, response) => {
        if (response.status === 401) {
          await clearToken();
        }
      },
    ],
  },
});

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
}

export async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  const res = await promise;
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!body.ok || body.data === undefined) {
    throw new ApiError(
      body.error?.code ?? "UNKNOWN",
      res.status,
      body.error?.message ?? "Request failed",
    );
  }
  return body.data;
}
