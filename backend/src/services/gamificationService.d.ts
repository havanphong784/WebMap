export function calculateLevel(xp: number): number;
export function addXP(
  userId: string,
  action: string,
): Promise<{ xp: number; level: number; tier: string; added: number } | undefined>;
export function updateAchievementProgress(userId: string, action: string): Promise<void>;
export function updateDailyTaskProgress(userId: string, action: string): Promise<void>;
export function getUnreadGamificationCount(userId: string): Promise<number>;
export function markAllAsSeen(userId: string): Promise<void>;
