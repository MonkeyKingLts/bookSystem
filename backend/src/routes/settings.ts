import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

router.put("/", (req, res) => {
  const updates = req.body as Record<string, string>;
  const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");

  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      upsert.run(key, String(value));
    }
  });
  transaction();

  db.prepare("INSERT INTO audit_logs (event_type, ip_address, status) VALUES ('Settings Updated', '192.168.1.45', '成功')").run();
  res.json({ success: true });
});

router.get("/audit-logs", (_req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20").all();
  res.json(logs);
});

router.get("/ip-whitelist", (_req, res) => {
  const list = db.prepare("SELECT * FROM ip_whitelist ORDER BY id").all();
  res.json(list);
});

router.post("/ip-whitelist", (req, res) => {
  const { name, ip_range } = req.body;
  if (!name || !ip_range) return res.status(400).json({ error: "名称和 IP 范围为必填项" });
  const result = db.prepare("INSERT INTO ip_whitelist (name, ip_range) VALUES (?, ?)").run(name, ip_range);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.delete("/ip-whitelist/:id", (req, res) => {
  db.prepare("DELETE FROM ip_whitelist WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
