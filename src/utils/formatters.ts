/**
 * Currency & Time utilities specifically tuned for Indian Rupee (INR)
 * and Asia/Kolkata timezone.
 */

// Convert Rupee string or number into integer paise
export function rupeesToPaise(val: number | string): number {
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'string') {
    // Strip commas, currency symbols, and spaces
    const cleanStr = val.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}

// Convert integer paise into rupee float
export function paiseToRupees(paise: number): number {
  if (isNaN(paise)) return 0;
  return paise / 100;
}

// Format integer paise into Indian Numbering System string (e.g. ₹1,25,000.00 or -₹5,000.00)
export function formatINR(
  paise: number,
  options?: {
    showSign?: boolean;
    showSymbol?: boolean;
    hideDecimalsIfZero?: boolean;
  }
): string {
  const isNegative = paise < 0;
  const absRupees = Math.abs(paise) / 100;

  const minDecimals = options?.hideDecimalsIfZero && paise % 100 === 0 ? 0 : 2;
  const maxDecimals = 2;

  const formattedNum = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(absRupees);

  const symbol = options?.showSymbol !== false ? '₹' : '';
  const prefix = isNegative ? '-' : options?.showSign && paise > 0 ? '+' : '';

  return `${prefix}${symbol}${formattedNum}`;
}

// Format number without symbol using Indian numbering
export function formatIndianNumber(val: number): string {
  return new Intl.NumberFormat('en-IN').format(val);
}

/**
 * Get current date (YYYY-MM-DD) and 12-hour time (e.g. 10:35 AM) in Asia/Kolkata timezone
 */
export function getKolkataNow(): {
  dateStr: string;
  time12: string;
  timestamp: number;
} {
  const now = new Date();

  // Date formatter for Asia/Kolkata (en-CA produces YYYY-MM-DD)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateStr = dateFormatter.format(now);

  // 12-hour time formatter for Asia/Kolkata (e.g. "10:35 AM")
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const time12 = timeFormatter.format(now);

  return {
    dateStr,
    time12,
    timestamp: now.getTime(),
  };
}

/**
 * Format a YYYY-MM-DD string into a human-friendly Indian date, e.g. "11 Oct 2026"
 */
export function formatIndianDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const d = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format timestamp into Asia/Kolkata date and time
 */
export function formatKolkataDateTime(timestamp: number): {
  dateStr: string;
  displayDate: string;
  time12: string;
} {
  const dateObj = new Date(timestamp);
  
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);

  const displayDate = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dateObj);

  const time12 = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);

  return { dateStr, displayDate, time12 };
}

/**
 * Combine YYYY-MM-DD and 12-hour time string ("10:35 AM" or "02:15 PM") into timestamp
 */
export function parseKolkataDateTime(dateStr: string, time12Str: string): number {
  if (!dateStr) return Date.now();
  
  // Parse time12Str
  let hours = 12;
  let minutes = 0;
  if (time12Str) {
    const match = time12Str.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = (match[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
  }

  // Create date string in ISO format for IST offset (+05:30)
  const [y, m, d] = dateStr.split('-');
  const isoStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
  const parsed = Date.parse(isoStr);
  return isNaN(parsed) ? Date.now() : parsed;
}

/**
 * Format 24h time HH:MM (e.g. from <input type="time">) to 12h AM/PM
 */
export function time24To12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Convert 12h AM/PM to 24h HH:MM for input fields
 */
export function time12To24(time12: string): string {
  if (!time12) return '12:00';
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return '12:00';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m}`;
}
