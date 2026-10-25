/**
 * SSE (Server-Sent Events) connection manager.
 * Quản lý các kết nối SSE theo userId, cho phép push event tới user cụ thể.
 */

import type { Response } from 'express';

export type SSEClient =
  | Response
  | { write(chunk: string): boolean | undefined; [key: string]: unknown };

export interface SSEEventPayload<T = unknown> {
  event: string;
  data: T;
}

// Map<userId, Set<Response>>
const connections = new Map<string, Set<SSEClient>>();

const dropConnection = (userId: string, res: SSEClient): void => {
  const userConns = connections.get(userId);
  if (!userConns) return;
  userConns.delete(res);
  if (userConns.size === 0) connections.delete(userId);
};

export const addConnection = (userId: string, res: SSEClient): void => {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)?.add(res);
};

export const removeConnection = (userId: string, res: SSEClient): void =>
  dropConnection(userId, res);

const safeWrite = (res: SSEClient, payload: string, userId?: string): boolean => {
  try {
    res.write(payload);
    return true;
  } catch {
    if (userId) dropConnection(userId, res);
    return false;
  }
};

/**
 * Gửi event tới một user cụ thể (tất cả tabs/devices).
 */
export const sendToUser = (userId: string, event: string, data: unknown): void => {
  const userConns = connections.get(userId);
  if (!userConns || userConns.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  // Snapshot để tránh mutate trong khi iterate
  for (const res of [...userConns]) {
    safeWrite(res, payload, userId);
  }
};

/**
 * Broadcast tới tất cả connected users.
 */
export const broadcast = (event: string, data: unknown): void => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const userId of [...connections.keys()]) {
    const userConns = connections.get(userId);
    if (!userConns) continue;
    for (const res of [...userConns]) {
      safeWrite(res, payload, userId);
    }
  }
};

export const isUserOnline = (userId: string): boolean => {
  const userConns = connections.get(userId);
  return Boolean(userConns && userConns.size > 0);
};

export const resetConnectionsForTesting = (): void => {
  connections.clear();
};
