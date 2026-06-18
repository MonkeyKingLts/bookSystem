import { db } from "../db.js";

export function getSetting(key: string, fallback = ""): string {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function syncOverdueStatus() {
  const today = new Date().toISOString().split("T")[0];
  db.prepare(`
    UPDATE borrowings SET status = '逾期'
    WHERE returned_at IS NULL AND due_date < ? AND status != '逾期'
  `).run(today);

  const overdueReaders = db.prepare(`
    SELECT DISTINCT r.id FROM readers r
    JOIN borrowings b ON b.reader_id = r.id
    WHERE b.status = '逾期' AND b.returned_at IS NULL
  `).all() as { id: number }[];

  for (const { id } of overdueReaders) {
    db.prepare("UPDATE readers SET status = '有逾期未还' WHERE id = ? AND status = '信用良好'").run(id);
  }
}

export function calculateFine(dueDate: string): number {
  const finePerDay = parseFloat(getSetting("overdue_fine_per_day", "0.5"));
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const days = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return days > 0 ? days * finePerDay : 0;
}

export function logAudit(eventType: string, ip: string, status: string) {
  db.prepare("INSERT INTO audit_logs (event_type, ip_address, status) VALUES (?, ?, ?)").run(eventType, ip, status);
}
