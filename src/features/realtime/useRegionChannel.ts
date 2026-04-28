import { useEffect } from "react";
import { getPusher } from "./pusher";

interface OwnershipUpdate {
  segmentIds: string[];
  factionId: string;
  userId: string;
}

/**
 * Subscribe to a region channel for live ownership flips.
 * Soketi connection is best-effort: if backend is down, the hook silently no-ops.
 *
 * `regionKey` should be a stable string per visible map area
 * (in MVP we use `"global"` until per-H3 channels land).
 */
export function useRegionChannel(
  regionKey: string | null,
  onUpdate: (u: OwnershipUpdate) => void,
): void {
  useEffect(() => {
    if (!regionKey) return;
    let mounted = true;
    let unsub: (() => void) | undefined;

    try {
      const pusher = getPusher();
      const ch = pusher.subscribe(`region-${regionKey}`);
      const handler = (data: OwnershipUpdate) => mounted && onUpdate(data);
      ch.bind("territory.updated", handler);
      unsub = () => {
        ch.unbind("territory.updated", handler);
        pusher.unsubscribe(`region-${regionKey}`);
      };
    } catch {
      // backend down / pusher misconfigured — silent
    }

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [regionKey, onUpdate]);
}
