import { Router } from "express";
import { db } from "../db.js";

const router = Router();

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

router.get("/recent", (_req, res) => {
  const transactions = db.prepare(`
    SELECT b.id, b.borrowed_at, b.due_date, b.returned_at, b.status, b.renewed_count,
      r.name as reader_name, bk.title as book_title
    FROM borrowings b
    JOIN readers r ON r.id = b.reader_id
    JOIN books bk ON bk.id = b.book_id
    ORDER BY b.borrowed_at DESC LIMIT 10
  `).all();
  res.json(transactions);
});

router.get("/overdue-count", (_req, res) => {
  const count = db.prepare("SELECT COUNT(*) as c FROM borrowings WHERE status = '逾期' AND returned_at IS NULL").get() as { c: number };
  res.json({ count: count.c });
});

router.post("/checkout", (req, res) => {
  const { readerId, bookIds } = req.body as { readerId: string; bookIds: number[] };
  if (!readerId || !bookIds?.length) {
    return res.status(400).json({ error: "读者 ID 和图书为必填项" });
  }

  const reader = db.prepare("SELECT * FROM readers WHERE reader_id = ?").get(readerId) as {
    id: number; name: string; status: string; borrow_limit: number;
  } | undefined;
  if (!reader) return res.status(404).json({ error: "读者不存在" });
  if (reader.status === "账户已封禁") return res.status(400).json({ error: "该读者账户已封禁" });

  const currentCount = db.prepare(
    "SELECT COUNT(*) as c FROM borrowings WHERE reader_id = ? AND returned_at IS NULL"
  ).get(reader.id) as { c: number };

  if (currentCount.c + bookIds.length > reader.borrow_limit) {
    return res.status(400).json({ error: `超出借阅上限 (${reader.borrow_limit} 本)` });
  }

  const borrowDays = parseInt(
    (db.prepare("SELECT value FROM settings WHERE key = 'borrow_days'").get() as { value: string })?.value || "14",
    10
  );
  const dueDate = addDays(borrowDays);

  const checkout = db.transaction(() => {
    const results = [];
    for (const bookId of bookIds) {
      const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId) as {
        id: number; title: string; available: number;
      } | undefined;
      if (!book) throw new Error(`图书 ID ${bookId} 不存在`);
      if (book.available <= 0) throw new Error(`《${book.title}》暂无可借副本`);

      db.prepare("UPDATE books SET available = available - 1 WHERE id = ?").run(bookId);
      const result = db.prepare(`
        INSERT INTO borrowings (reader_id, book_id, due_date, status)
        VALUES (?, ?, ?, '已借出')
      `).run(reader.id, bookId, dueDate);

      db.prepare(`
        INSERT INTO activities (type, book_title, reader_name, status)
        VALUES ('borrow', ?, ?, '已借出')
      `).run(book.title, reader.name);

      results.push({ id: result.lastInsertRowid, bookTitle: book.title });
    }
    return results;
  });

  try {
    const results = checkout();
    res.json({ success: true, dueDate, items: results });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/return", (req, res) => {
  const { borrowingId } = req.body;
  if (!borrowingId) return res.status(400).json({ error: "借阅记录 ID 为必填项" });

  const borrowing = db.prepare(`
    SELECT b.*, bk.title as book_title, r.name as reader_name
    FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    JOIN readers r ON r.id = b.reader_id
    WHERE b.id = ? AND b.returned_at IS NULL
  `).get(borrowingId) as {
    id: number; book_id: number; book_title: string; reader_name: string;
  } | undefined;

  if (!borrowing) return res.status(404).json({ error: "借阅记录不存在或已归还" });

  db.prepare("UPDATE borrowings SET returned_at = datetime('now'), status = '已归还' WHERE id = ?").run(borrowingId);
  db.prepare("UPDATE books SET available = available + 1 WHERE id = ?").run(borrowing.book_id);
  db.prepare(`
    INSERT INTO activities (type, book_title, reader_name, status)
    VALUES ('return', ?, ?, '已还')
  `).run(borrowing.book_title, borrowing.reader_name);

  res.json({ success: true });
});

router.post("/return-by-isbn", (req, res) => {
  const { isbn } = req.body;
  if (!isbn) return res.status(400).json({ error: "ISBN 为必填项" });

  const borrowing = db.prepare(`
    SELECT b.id FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    WHERE bk.isbn = ? AND b.returned_at IS NULL
    LIMIT 1
  `).get(isbn) as { id: number } | undefined;

  if (!borrowing) return res.status(404).json({ error: "未找到该图书的活跃借阅记录" });

  req.body.borrowingId = borrowing.id;
  return router.handle({ ...req, method: "POST", url: "/return" } as never, res);
});

router.post("/renew", (req, res) => {
  const { borrowingId } = req.body;
  if (!borrowingId) return res.status(400).json({ error: "借阅记录 ID 为必填项" });

  const borrowing = db.prepare("SELECT * FROM borrowings WHERE id = ? AND returned_at IS NULL").get(borrowingId) as {
    id: number; renewed_count: number; book_id: number;
  } | undefined;
  if (!borrowing) return res.status(404).json({ error: "借阅记录不存在" });

  const maxRenewals = parseInt(
    (db.prepare("SELECT value FROM settings WHERE key = 'max_renewals'").get() as { value: string })?.value || "2",
    10
  );
  if (borrowing.renewed_count >= maxRenewals) {
    return res.status(400).json({ error: `已达最大续借次数 (${maxRenewals} 次)` });
  }

  const borrowDays = parseInt(
    (db.prepare("SELECT value FROM settings WHERE key = 'borrow_days'").get() as { value: string })?.value || "14",
    10
  );
  const newDueDate = addDays(borrowDays);

  const book = db.prepare("SELECT title FROM books WHERE id = ?").get(borrowing.book_id) as { title: string };

  db.prepare(`
    UPDATE borrowings SET due_date = ?, renewed_count = renewed_count + 1, status = '已续借'
    WHERE id = ?
  `).run(newDueDate, borrowingId);

  db.prepare(`
    INSERT INTO activities (type, book_title, reader_name, status)
    VALUES ('renew', ?, '系统', '已续借')
  `).run(book.title);

  res.json({ success: true, newDueDate });
});

router.get("/overdue", (_req, res) => {
  const overdue = db.prepare(`
    SELECT b.*, r.name as reader_name, r.reader_id, bk.title as book_title, bk.isbn
    FROM borrowings b
    JOIN readers r ON r.id = b.reader_id
    JOIN books bk ON bk.id = b.book_id
    WHERE b.status = '逾期' AND b.returned_at IS NULL
    ORDER BY b.due_date ASC
  `).all();
  res.json(overdue);
});

router.get("/reader/:readerId/borrowings", (req, res) => {
  const reader = db.prepare("SELECT id FROM readers WHERE reader_id = ?").get(req.params.readerId) as { id: number } | undefined;
  if (!reader) return res.status(404).json({ error: "读者不存在" });

  const borrowings = db.prepare(`
    SELECT b.*, bk.title as book_title, bk.isbn
    FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    WHERE b.reader_id = ? AND b.returned_at IS NULL
  `).all(reader.id);
  res.json(borrowings);
});

export default router;
