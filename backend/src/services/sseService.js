/**
 * SSE (Server-Sent Events) connection manager.
 * Quản lý các kết nối SSE theo userId, cho phép push event tới user cụ thể.
 */

// Map<userId, Set<Response>>
const connections = new Map();

const dropConnection = (userId, res) => {
  const userConns = connections.get(userId);
  if (!userConns) return;
  userConns.delete(res);
  if (userConns.size === 0) connections.delete(userId);
};

export const addConnection = (userId, res) => {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(res);
};

export const removeConnection = (userId, res) => dropConnection(userId, res);

const safeWrite = (res, payload, userId) => {
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
export const sendToUser = (userId, event, data) => {
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
export const broadcast = (event, data) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const userId of [...connections.keys()]) {
    const userConns = connections.get(userId);
    if (!userConns) continue;
    for (const res of [...userConns]) {
      safeWrite(res, payload, userId);
    }
  }
};

export const isUserOnline = (userId) =>
  connections.has(userId) && connections.get(userId).size > 0;
