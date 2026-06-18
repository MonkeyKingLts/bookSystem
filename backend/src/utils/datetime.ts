const BEIJING_TZ = 'Asia/Shanghai';

export function nowUtc(): string {
  return new Date().toISOString();
}

export function nowSqliteUtc(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function formatBeijing(date: Date = new Date()): string {
  return date.toLocaleString('zh-CN', { timeZone: BEIJING_TZ });
}
