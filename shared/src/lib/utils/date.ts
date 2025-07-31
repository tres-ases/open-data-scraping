// Date utility functions

/**
 * Formats a date to ISO string
 */
export function toISOString(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Formats a date to date-only string (YYYY-MM-DD)
 */
export function toDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Formats a date for display (DD/MM/YYYY)
 */
export function toDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-CL');
}

/**
 * Formats a date for display with time (DD/MM/YYYY HH:mm)
 */
export function toDisplayDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Gets the start of day for a given date
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets the end of day for a given date
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Gets the start of month for a given date
 */
export function startOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Gets the end of month for a given date
 */
export function endOfMonth(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Checks if a date is within a range
 */
export function isDateInRange(
  date: Date | string,
  startDate?: Date | string,
  endDate?: Date | string
): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (startDate) {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    if (d < start) return false;
  }

  if (endDate) {
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    if (d > end) return false;
  }

  return true;
}

/**
 * Gets the difference in days between two dates
 */
export function daysDifference(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generates S3 partition path for a date (year=YYYY/month=MM)
 */
export function getS3PartitionPath(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `year=${year}/month=${month}`;
}

/**
 * Generates S3 partition path with day (year=YYYY/month=MM/day=DD)
 */
export function getS3PartitionPathWithDay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `year=${year}/month=${month}/day=${day}`;
}

/**
 * Gets the current Chilean time (UTC-3 or UTC-4 depending on DST)
 */
export function getChileanTime(): Date {
  // Chile uses UTC-3 (CLST) during summer and UTC-4 (CLT) during winter
  // This is a simplified version - in production you'd want to use a proper timezone library
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

  // Approximate DST calculation for Chile (October to March)
  const month = now.getMonth() + 1;
  const isDST = month >= 10 || month <= 3;
  const offset = isDST ? -3 : -4; // UTC-3 during DST, UTC-4 otherwise

  return new Date(utc + (offset * 3600000));
}

/**
 * Validates if a string is a valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}
