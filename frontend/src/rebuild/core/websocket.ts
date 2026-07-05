/**
 * WebSocket client for real-time notifications.
 * Uses SockJS + STOMP (native browser WebSocket with fallback).
 *
 * Usage:
 *   const ws = useWebSocket();
 *   ws.connect(token);
 *   ws.subscribe((notification) => { ... });
 *   ws.disconnect();
 */

export interface NotificationPayload {
  id: string;
  title: string;
  content: string;
  targetType: string;
  targetId: string | null;
  createdBy: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}

type MessageHandler = (notification: NotificationPayload) => void;

let stompClient: any = null;
let handlers: Set<MessageHandler> = new Set();

/**
 * Minimal STOMP over WebSocket client (no external dependencies).
 * Connects to /ws endpoint and subscribes to /user/queue/notifications.
 */
export function useWebSocket() {
  return {
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    isConnected: () => stompClient !== null,
  };
}

function subscribe(handler: MessageHandler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

function unsubscribe(handler: MessageHandler) {
  handlers.delete(handler);
}

async function connect(token: string) {
  if (stompClient) return;

  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

  try {
    // Dynamic import of SockJS — loaded on demand
    // @ts-ignore — sockjs-client types may not be installed
    const SockJS = (await import('sockjs-client')).default;
    // @ts-ignore — @stomp/stompjs types may not be installed
    const Stomp = (await import('@stomp/stompjs')).Stomp;

    const socket = new SockJS(wsUrl);
    const client = Stomp.over(socket);

    // Suppress debug logs
    client.debug = () => {};

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        stompClient = client;
        client.subscribe('/user/queue/notifications', (message: any) => {
          try {
            const notification: NotificationPayload = JSON.parse(message.body);
            handlers.forEach((h) => h(notification));
          } catch (e) {
            console.error('[WS] Failed to parse notification:', e);
          }
        });
      },
      (error: any) => {
        console.error('[WS] Connection error:', error);
        stompClient = null;
        // Auto-reconnect after 5 seconds
        setTimeout(() => connect(token), 5000);
      }
    );
  } catch (e) {
    console.warn('[WS] SockJS/STOMP not available, WebSocket disabled:', e);
  }
}

function disconnect() {
  if (stompClient) {
    stompClient.disconnect(() => {});
    stompClient = null;
  }
  handlers.clear();
}
