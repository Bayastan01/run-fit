import Pusher from "pusher-js/react-native";
import { env } from "@/lib/env";
import { api } from "@/api/client";

let _client: Pusher | null = null;

/**
 * Lazy Pusher (Soketi) client. Auth signs each private/presence channel via /api/ws/auth.
 */
export function getPusher(): Pusher {
  if (_client) return _client;
  _client = new Pusher(env.soketiKey, {
    wsHost: env.soketiHost,
    wsPort: env.soketiPort,
    wssPort: env.soketiPort,
    forceTLS: false,
    cluster: "soketi",
    enabledTransports: ["ws", "wss"],
    channelAuthorization: {
      transport: "ajax",
      endpoint: `${env.apiUrl}/api/ws/auth`,
      customHandler: async ({ socketId, channelName }, callback) => {
        try {
          const res: any = await api.post("api/ws/auth", {
            json: { socket_id: socketId, channel_name: channelName },
          }).json();
          callback(null, res?.data ?? res);
        } catch (e) {
          callback(e as Error, null);
        }
      },
    },
  });
  return _client;
}

export function disconnectPusher() {
  _client?.disconnect();
  _client = null;
}
