import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Format date for display
 */
export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: ko });
}

/**
 * Format date relative to now (e.g., "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ko });
}

/**
 * Check if a date is overdue (past today)
 */
export function isOverdue(dueDate: string | Date): boolean {
  const dateObj = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return isBefore(dateObj, today);
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
