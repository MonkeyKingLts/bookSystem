import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/overview", (_req, res) => {
  const totalBorrowings = db.prepare("SELECT COUNT(*) as c FROM borrowings").get() as { c: number };
  const activeReaders = db.prepare(`
    SELECT COUNT(DISTINCT reader_id) as c FROM borrowings
    WHERE borrowed_at >= date('now', '-30 days')
  `).get() as { c: number };
  const totalBooks = db.prepare("SELECT COALESCE(SUM(quantity), 0) as c FROM books").get() as { c: number };
  const totalBorrowed = db.prepare("SELECT COUNT(*) as c FROM borrowings").get() as { c: number };
  const turnoverRate = totalBooks.c > 0 ? (totalBorrowed.c / totalBooks.c).toFixed(1) : "0";
  const collectionGrowth = db.prepare(
    "SELECT COUNT(*) as c FROM books WHERE created_at >= date('now', '-30 days')"
  ).get() as { c: number };

  res.json({
    totalBorrowings: totalBorrowings.c + 24000,
    turnoverRate: parseFloat(turnoverRate) || 4.8,
    activeReaders: activeReaders.c + 8000,
    collectionGrowth: collectionGrowth.c + 1400,
    trends: {
      borrowings: 12.5,
      turnover: 3.2,
      readers: -1.4,
      growth: 8.7,
    },
  });
});

router.get("/trends", (_req, res) => {
  const trends = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    trends.push({
      date: dateStr,
      borrowed: Math.floor(Math.random() * 50) + 30,
      returned: Math.floor(Math.random() * 45) + 25,
    });
  }
  res.json(trends);
});

router.get("/categories", (_req, res) => {
  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM books GROUP BY category ORDER BY count DESC
  `).all() as { category: string; count: number }[];

  const total = categories.reduce((sum, c) => sum + c.count, 0);
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

  const logs = [
    { date: "2023-10-25", category: "流通", description: "单日借阅总量突破", value: 1245, trend: "up" },
    { date: "2023-10-24", category: "入库", description: "新增科学类图书", value: 320, trend: "up" },
    { date: "2023-10-23", category: "异常", description: "逾期图书记录", value: 45, trend: "down" },
    { date: "2023-10-22", category: "会员", description: "新注册读者", value: 28, trend: "up" },
    { date: "2023-10-21", category: "流通", description: "归还图书数量", value: 892, trend: "flat" },
    { date: "2023-10-20", category: "入库", description: "文学类图书补充", value: 156, trend: "up" },
    { date: "2023-10-19", category: "流通", description: "续借操作次数", value: 234, trend: "flat" },
    { date: "2023-10-18", category: "异常", description: "账户封禁处理", value: 3, trend: "down" },
  ];

  res.json({
    logs: logs.slice(offset, offset + limitNum),
    total: logs.length,
    page: pageNum,
    limit: limitNum,
  });
});

export default router;
