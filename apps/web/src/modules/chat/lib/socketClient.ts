'use client';

import { io, type Socket } from 'socket.io-client';

import { config } from '@/lib/config';
import { getValidAccessToken } from '@/modules/auth/lib/tokenBridge';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

export type AfratSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * A single shared socket for the whole app.
 *
 * Rooms multiplex over it — opening three chatrooms must not open three
 * TCP connections on a cellular link. `useChatSocket` acquires/releases a
 * reference; the socket disconnects once the last consumer unmounts.
 */
let socket: AfratSocket | null = null;
let refCount = 0;

export function acquireSocket(): AfratSocket {
  if (!socket) {
    socket = io(config.socketUrl, {
      path: config.socketPath,

      // WebSocket first — but keep polling in the list. On networks where the
      // WS upgrade is blocked or mangled (common on Iranian mobile carriers
      // behind transparent proxies) Socket.io silently stays on HTTP
      // long-polling instead of failing the connection outright.
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,

      // Reconnection with exponential backoff + jitter. `randomizationFactor`
      // spreads the herd so a server restart is not met by a thundering
      // reconnect from every client at the same millisecond.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 20_000,
      randomizationFactor: 0.5,

      // Handshake timeout: fail fast enough to try the other transport while
      // the user is still looking at the screen.
      timeout: 12_000,

      autoConnect: false,
      withCredentials: true,

      // A callback, not a static value: Socket.io calls this on every
      // connection *and every reconnection*, so an access token that expired
      // while the phone was in a tunnel is refreshed before the retry rather
      // than replayed dead.
      auth: (cb: (data: { token?: string }) => void) => {
        void getValidAccessToken().then((fresh) => cb({ token: fresh ?? undefined }));
      },
    });
  }

  refCount += 1;
  if (!socket.connected && socket.disconnected) socket.connect();
  return socket;
}

export function releaseSocket() {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
}

/** Current transport name — `websocket` or `polling`. */
export function currentTransport(s: AfratSocket | null): string | null {
  // `io.engine` is undefined until the handshake completes.
  return s?.io?.engine?.transport?.name ?? null;
}

/**
 * Socket.io ships its own ping/pong heartbeat, but a *silent* drop (NAT
 * rebinding on a mobile network, captive portal) can leave the socket
 * believing it is connected. This adds an application-level liveness probe:
 * if no server packet arrives within `staleAfterMs`, force a reconnect.
 */
export function installHeartbeatWatchdog(
  s: AfratSocket,
  { staleAfterMs = 45_000, checkEveryMs = 15_000 } = {},
): () => void {
  let lastPacketAt = Date.now();

  const touch = () => {
    lastPacketAt = Date.now();
  };

  const engine = s.io.engine;
  engine?.on('packet', touch);
  s.on('connect', touch);
  s.onAny(touch);

  const timer = setInterval(() => {
    if (document.visibilityState === 'hidden') {
      // Backgrounded tabs get throttled timers; the browser will not deliver
      // packets reliably either. Don't punish the socket for that.
      lastPacketAt = Date.now();
      return;
    }
    if (Date.now() - lastPacketAt > staleAfterMs) {
      lastPacketAt = Date.now();
      // `disconnect()` + `connect()` restarts the reconnect ladder cleanly.
      s.disconnect();
      s.connect();
    }
  }, checkEveryMs);

  return () => {
    clearInterval(timer);
    engine?.off('packet', touch);
    s.offAny(touch);
  };
}
