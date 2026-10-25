export type BackHandler = () => boolean;

export interface RegisteredBackHandler {
  close: BackHandler;
  priority: number;
  token: number;
}

const handlers = new Map<string, RegisteredBackHandler>();
let sequence = 0;

export const registerBackHandler = (
  id: string,
  close: BackHandler,
  priority: number = 0
): (() => void) => {
  const token = ++sequence;
  handlers.set(id, {close, priority, token});

  return () => {
    if (handlers.get(id)?.token === token) handlers.delete(id);
  };
};

export const closeTopOverlay = (): boolean => {
  const ordered = [...handlers.values()].sort((left, right) => (
    right.priority - left.priority || right.token - left.token
  ));

  for (const handler of ordered) {
    if (handler.close() === true) return true;
  }
  return false;
};

export const resetBackHandlersForTests = (): void => {
  handlers.clear();
  sequence = 0;
};
