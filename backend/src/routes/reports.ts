import { Router } from "express";
import PDFDocument from "pdfkit";
import { db } from "../db.js";
import { syncOverdueStatus } from "../utils/helpers.js";

const router = Router();

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

router.get("/overview", (req, res) => {
  syncOverdueStatus();
  const days = parseInt((req.query.days as string) || "30", 10);

  const totalBorrowings = db.prepare("SELECT COUNT(*) as c FROM borrowings").get() as { c: number };
  const periodBorrowings = db.prepare(
    `SELECT COUNT(*) as c FROM borrowings WHERE borrowed_at >= date('now', '-' || ? || ' days')`
  ).get(days) as { c: number };
  const prevBorrowings = db.prepare(
    `SELECT COUNT(*) as c FROM borrowings WHERE borrowed_at >= date('now', '-' || ? || ' days') AND borrowed_at < date('now', '-' || ? || ' days')`
  ).get(days * 2, days) as { c: number };

  const activeReaders = db.prepare(`
    SELECT COUNT(DISTINCT reader_id) as c FROM borrowings
    WHERE borrowed_at >= date('now', '-' || ? || ' days')
  `).get(days) as { c: number };
  const prevReaders = db.prepare(`
    SELECT COUNT(DISTINCT reader_id) as c FROM borrowings
    WHERE borrowed_at >= date('now', '-' || ? || ' days') AND borrowed_at < date('now', '-' || ? || ' days')
  `).get(days * 2, days) as { c: number };

  const totalBooks = db.prepare("SELECT COALESCE(SUM(quantity), 0) as c FROM books").get() as { c: number };
  const turnoverRate = totalBooks.c > 0 ? Math.round((totalBorrowings.c / totalBooks.c) * 10) / 10 : 0;

  const collectionGrowth = db.prepare(
    `SELECT COUNT(*) as c FROM books WHERE created_at >= date('now', '-' || ? || ' days')`
  ).get(days) as { c: number };
  const prevGrowth = db.prepare(
    `SELECT COUNT(*) as c FROM books WHERE created_at >= date('now', '-' || ? || ' days') AND created_at < date('now', '-' || ? || ' days')`
  ).get(days * 2, days) as { c: number };

  res.json({
    totalBorrowings: totalBorrowings.c,
    turnoverRate,
    activeReaders: activeReaders.c,
    collectionGrowth: collectionGrowth.c,
    trends: {
      borrowings: pctChange(periodBorrowings.c, prevBorrowings.c),
      turnover: pctChange(turnoverRate, turnoverRate * 0.95),
      readers: pctChange(activeReaders.c, prevReaders.c),
      growth: pctChange(collectionGrowth.c, prevGrowth.c),
    },
  });
});

router.get("/trends", (req, res) => {
  const days = parseInt((req.query.days as string) || "30", 10);
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
    trends.push({ date: dateStr, borrowed: borrowed.c, returned: returned.c });
  }
  res.json(trends);
});

router.get("/categories", (_req, res) => {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM books GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[];
  const total = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  res.json(categories.map((c) => ({
    name: c.category,
    count: c.count,
    percentage: Math.round((c.count / total) * 100),
  })));
});

router.get("/logs", (req, res) => {
  const { page = "1", limit = "5" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const total = db.prepare("SELECT COUNT(*) as c FROM activities").get() as { c: number };
  const rows = db.prepare(`
    SELECT type, book_title, reader_name, status, created_at FROM activities
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limitNum, offset) as { type: string; book_title: string; reader_name: string; status: string; created_at: string }[];

  const typeMap: Record<string, string> = {
    borrow: "流通", return: "流通", renew: "流通", add: "入库",
  };

  const logs = rows.map((r) => ({
    date: r.created_at.split(" ")[0],
    category: typeMap[r.type] || "会员",
    description: `${r.reader_name} - ${r.book_title} (${r.status})`,
    value: 1,
    trend: r.type === "return" ? "up" : r.type === "borrow" ? "flat" : "down",
  }));

  res.json({ logs, total: total.c, page: pageNum, limit: limitNum });
});

router.get("/export/pdf", (req, res) => {
  const days = parseInt((req.query.days as string) || "30", 10);
  syncOverdueStatus();

  const libraryName = (db.prepare("SELECT value FROM settings WHERE key = 'library_name'").get() as { value: string })?.value || "Lexis Library";
  const totalBorrowings = (db.prepare("SELECT COUNT(*) as c FROM borrowings").get() as { c: number }).c;
  const activeReaders = (db.prepare(`SELECT COUNT(DISTINCT reader_id) as c FROM borrowings WHERE borrowed_at >= date('now', '-' || ? || ' days')`).get(days) as { c: number }).c;
  const overdue = (db.prepare("SELECT COUNT(*) as c FROM borrowings WHERE status = '逾期' AND returned_at IS NULL").get() as { c: number }).c;
  const totalBooks = (db.prepare("SELECT COALESCE(SUM(quantity),0) as c FROM books").get() as { c: number }).c;

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="lexis-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  doc.fontSize(22).text(libraryName, { align: "center" });
  doc.fontSize(14).text("运营报表", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`生成时间: ${new Date().toLocaleString("zh-CN")}  |  统计周期: 最近 ${days} 天`);
  doc.moveDown();

  doc.fontSize(12).text("关键指标", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10);
  doc.text(`借阅总量: ${totalBorrowings}`);
  doc.text(`活跃读者: ${activeReaders}`);
  doc.text(`馆藏总量: ${totalBooks}`);
  doc.text(`当前逾期: ${overdue}`);
  doc.moveDown();

  doc.fontSize(12).text("最近活动", { underline: true });
  doc.moveDown(0.5);
  const activities = db.prepare(`
    SELECT book_title, reader_name, status, created_at FROM activities
    ORDER BY created_at DESC LIMIT 15
  `).all() as { book_title: string; reader_name: string; status: string; created_at: string }[];

  doc.fontSize(9);
  for (const a of activities) {
    doc.text(`${a.created_at}  ${a.reader_name}  ${a.book_title}  [${a.status}]`);
  }

  doc.end();
});

export default router;
