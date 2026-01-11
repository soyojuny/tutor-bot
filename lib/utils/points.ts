/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  return `${points}P`;
}

/**
 * Calculate points based on activity difficulty
 */
export function calculatePoints(category: string, basePoints: number = 10): number {
  const multipliers: Record<string, number> = {
    homework: 2.0,
    'problem-solving': 1.5,
    practice: 1.2,
    reading: 1.0,
    other: 1.0,
  };

  const multiplier = multipliers[category] || 1.0;
  return Math.round(basePoints * multiplier);
}

/**
 * Get current points balance from ledger transactions
 */
export function getCurrentBalance(transactions: Array<{ points_change: number }>): number {
  return transactions.reduce((sum, t) => sum + t.points_change, 0);
}

/**
 * Check if user has enough points for a redemption
 */
export function canAffordReward(currentBalance: number, rewardCost: number): boolean {
  return currentBalance >= rewardCost;
}
