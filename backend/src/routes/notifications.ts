import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (_req, res) => {
  const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20").all();
  res.json(notifications);
});

router.get("/unread-count", (_req, res) => {
  const count = db.prepare("SELECT COUNT(*) as c FROM notifications WHERE read = 0").get() as { c: number };
  res.json({ count: count.c });
});

router.put("/:id/read", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

router.put("/read-all", (_req, res) => {
  db.prepare("UPDATE notifications SET read = 1").run();
  res.json({ success: true });
});

export default router;
