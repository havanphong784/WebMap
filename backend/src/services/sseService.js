/**
 * SSE (Server-Sent Events) connection manager.
 * Quản lý các kết nối SSE theo userId, cho phép push event tới user cụ thể.
 */

// Map<userId, Set<Response>>
const connections = new Map();

/**
 * Đăng ký một SSE connection cho user.
 */
export const addConnection = (userId, res) => {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId).add(res);
};

/**
 * Hủy đăng ký khi client disconnect.
 */
export const removeConnection = (userId, res) => {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(res);
    if (userConns.size === 0) {
      connections.delete(userId);
    }
  }
};

/**
 * Gửi event tới một user cụ thể (tất cả tabs/devices).
 */
export const sendToUser = (userId, event, data) => {
  const userConns = connections.get(userId);
  if (!userConns || userConns.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of userConns) {
    try {
      res.write(payload);
    } catch {
      // Connection đã đóng, cleanup
      userConns.delete(res);
    }
  }
};

/**
 * Gửi event tới nhiều users.
 */
export const sendToUsers = (userIds, event, data) => {
  for (const userId of userIds) {
    sendToUser(userId, event, data);
  }
};

/**
 * Broadcast tới tất cả connected users.
 */
export const broadcast = (event, data) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [, userConns] of connections) {
    for (const res of userConns) {
      try {
        res.write(payload);
      } catch {
        userConns.delete(res);
      }
    }
  }
};

/**
 * Lấy danh sách userId đang online (có ít nhất 1 SSE connection).
 */
export const getOnlineUserIds = () => [...connections.keys()];

/**
 * Kiểm tra user có đang online không.
 */
export const isUserOnline = (userId) => connections.has(userId) && connections.get(userId).size > 0;

/**
 * Đếm tổng connections.
 */
export const getConnectionCount = () => {
  let count = 0;
  for (const [, userConns] of connections) {
    count += userConns.size;
  }
  return count;
};
