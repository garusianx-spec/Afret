/**
 * Runtime configuration. Everything here is `NEXT_PUBLIC_*` so it is inlined at
 * build time and available inside the client bundle and the socket client.
 */
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  socketUrl:
    process.env.NEXT_PUBLIC_SOCKET_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000',
  socketPath: process.env.NEXT_PUBLIC_SOCKET_PATH ?? '/realtime',
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  registerSwInDev: process.env.NEXT_PUBLIC_SW_IN_DEV === '1',
} as const;

export const isBrowser = typeof window !== 'undefined';
