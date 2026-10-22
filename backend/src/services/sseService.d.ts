export function addConnection(userId: string, res: unknown): void;
export function removeConnection(userId: string, res: unknown): void;
export function sendToUser(userId: string, event: string, data: unknown): void;
export function broadcast(event: string, data: unknown): void;
export function isUserOnline(userId: string): boolean;
