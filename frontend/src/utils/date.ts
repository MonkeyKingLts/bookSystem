const BEIJING_TZ = 'Asia/Shanghai';

/** SQLite datetime('now') 存的是 UTC，需按 UTC 解析后再转北京时间 */
export function parseDbDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  return new Date(`${normalized}Z`);
}

export function formatDateTime(dateStr: string): string {
  return parseDbDate(dateStr).toLocaleString('zh-CN', {
    timeZone: BEIJING_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(dateStr: string): string {
  return parseDbDate(dateStr).toLocaleDateString('zh-CN', {
    timeZone: BEIJING_TZ,
    year: 'numeric',
    month: 'short',
  });
}

export function formatTime(dateStr: string): string {
  return parseDbDate(dateStr).toLocaleTimeString('zh-CN', {
    timeZone: BEIJING_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function nowBeijingString(): string {
  return new Date().toLocaleString('zh-CN', { timeZone: BEIJING_TZ });
}
