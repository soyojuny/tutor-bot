/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return `${points}P`;
}

/**
 * Check if user has enough points for a redemption
 */
export function canAffordReward(currentBalance: number, rewardCost: number): boolean {
  return currentBalance >= rewardCost;
}
