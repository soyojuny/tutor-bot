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
 * Get today's date in YYYY-MM-DD format (server local time)
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ============================================
// KST (Korea Standard Time) 기준 날짜/시간 유틸리티
// 서버 타임존에 관계없이 한국 시간 기준으로 날짜를 계산합니다.
// ============================================

const KST_TIMEZONE = 'Asia/Seoul';

/**
 * Get today's date in YYYY-MM-DD format (KST 기준)
 * 서버 타임존과 관계없이 한국 시간 기준 날짜를 반환합니다.
 */
export function getKSTDateString(): string {
  // en-CA 로케일은 ISO 8601 형식(YYYY-MM-DD)으로 날짜를 출력합니다.
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Get current day of week in KST (0=Sunday, 1=Monday, ..., 6=Saturday)
 * 한국 시간 기준 요일을 반환합니다.
 */
export function getKSTDay(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: KST_TIMEZONE,
    weekday: 'short',
  });
  const dayStr = formatter.format(new Date());
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return dayMap[dayStr] ?? 0;
}
