const handlers = new Map();
let sequence = 0;

export const registerBackHandler = (id, close, priority = 0) => {
  const token = ++sequence;
  handlers.set(id, {close, priority, token});

  return () => {
    if (handlers.get(id)?.token === token) handlers.delete(id);
  };
};

export const closeTopOverlay = () => {
  const ordered = [...handlers.values()].sort((left, right) => (
    right.priority - left.priority || right.token - left.token
  ));

  for (const handler of ordered) {
    if (handler.close() === true) return true;
  }
  return false;
};

export const resetBackHandlersForTests = () => {
  handlers.clear();
  sequence = 0;
};
