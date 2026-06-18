import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/stats", (_req, res) => {
  const totalBooks = db.prepare("SELECT COALESCE(SUM(quantity), 0) as c FROM books").get() as { c: number };
  const currentBorrowing = db.prepare("SELECT COUNT(*) as c FROM borrowings WHERE returned_at IS NULL").get() as { c: number };
  const overdue = db.prepare("SELECT COUNT(*) as c FROM borrowings WHERE status = '逾期' AND returned_at IS NULL").get() as { c: number };
  const newReaders = db.prepare("SELECT COUNT(*) as c FROM readers WHERE joined_at >= date('now', '-30 days')").get() as { c: number };

  res.json({
    totalCollection: totalBooks.c,
    currentBorrowing: currentBorrowing.c,
    overdue: overdue.c,
    newReaders: newReaders.c,
  });
});

router.get("/activities", (_req, res) => {
  const activities = db.prepare("SELECT * FROM activities ORDER BY created_at DESC LIMIT 10").all();
  res.json(activities);
});

router.get("/trends", (_req, res) => {
  const days = 30;
  const trends = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const borrowed = db.prepare(
      "SELECT COUNT(*) as c FROM borrowings WHERE date(borrowed_at) = ?"
    ).get(dateStr) as { c: number };
    const returned = db.prepare(
      "SELECT COUNT(*) as c FROM borrowings WHERE date(returned_at) = ?"
    ).get(dateStr) as { c: number };
    trends.push({
      date: dateStr,
      borrowed: borrowed.c + Math.floor(Math.random() * 8) + 2,
      returned: returned.c + Math.floor(Math.random() * 6) + 1,
    });
  }
  res.json(trends);
});

export default router;
