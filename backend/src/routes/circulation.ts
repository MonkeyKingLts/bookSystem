import { Router } from "express";
import { db } from "../db.js";
import { syncOverdueStatus, calculateFine } from "../utils/helpers.js";
import { nowSqliteUtc } from "../utils/datetime.js";

const router = Router();

router.use((_req, _res, next) => {
  syncOverdueStatus();
  next();
});

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function processReturn(borrowingId: number) {
  const borrowing = db.prepare(`
    SELECT b.*, bk.title as book_title, bk.id as book_id, r.id as reader_db_id, r.name as reader_name
    FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    JOIN readers r ON r.id = b.reader_id
    WHERE b.id = ? AND b.returned_at IS NULL
  `).get(borrowingId) as {
    id: number; book_id: number; book_title: string; reader_db_id: number;
    reader_name: string; due_date: string; status: string;
  } | undefined;

  if (!borrowing) throw new Error("借阅记录不存在或已归还");

  const fine = borrowing.status === "逾期" ? calculateFine(borrowing.due_date) : 0;

  db.prepare("UPDATE borrowings SET returned_at = ?, status = '已归还' WHERE id = ?").run(nowSqliteUtc(), borrowingId);
  db.prepare("UPDATE books SET available = available + 1 WHERE id = ?").run(borrowing.book_id);

  if (fine > 0) {
    db.prepare("UPDATE readers SET fines = fines + ? WHERE id = ?").run(fine, borrowing.reader_db_id);
  }

  const activeOverdue = db.prepare(`
    SELECT COUNT(*) as c FROM borrowings WHERE reader_id = ? AND status = '逾期' AND returned_at IS NULL
  `).get(borrowing.reader_db_id) as { c: number };

  if (activeOverdue.c === 0) {
    db.prepare("UPDATE readers SET status = '信用良好' WHERE id = ? AND status = '有逾期未还'").run(borrowing.reader_db_id);
  }

  db.prepare(`
    INSERT INTO activities (type, book_title, reader_name, status)
    VALUES ('return', ?, ?, '已还')
  `).run(borrowing.book_title, borrowing.reader_name);

  return { fine, bookTitle: borrowing.book_title };
}

router.get("/recent", (req, res) => {
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const transactions = db.prepare(`
    SELECT b.id, b.borrowed_at, b.due_date, b.returned_at, b.status, b.renewed_count,
      r.name as reader_name, bk.title as book_title
    FROM borrowings b
    JOIN readers r ON r.id = b.reader_id
    JOIN books bk ON bk.id = b.book_id
    ORDER BY COALESCE(b.returned_at, b.borrowed_at) DESC LIMIT ?
  `).all(limit);
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
        id: number; title: string; isbn: string; available: number;
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

      results.push({ id: result.lastInsertRowid, bookTitle: book.title, isbn: book.isbn });
    }
    return results;
  });

  try {
    const items = checkout();
    res.json({
      success: true,
      dueDate,
      items,
      reader: { name: reader.name, readerId },
      checkoutDate: new Date().toISOString(),
    });
  } catch (e: unknown) {
    res.status(400).json({ error: (e as Error).message });
  }
});

router.post("/return", (req, res) => {
  const { borrowingId } = req.body;
  if (!borrowingId) return res.status(400).json({ error: "借阅记录 ID 为必填项" });
  try {
    const result = processReturn(borrowingId);
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    res.status(404).json({ error: (e as Error).message });
  }
});

router.post("/return-by-isbn", (req, res) => {
  const { isbn, readerId } = req.body as { isbn?: string; readerId?: string };
  if (!isbn) return res.status(400).json({ error: "ISBN 为必填项" });

  let query = `
    SELECT b.id FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    WHERE bk.isbn = ? AND b.returned_at IS NULL
  `;
  const params: string[] = [isbn];
  if (readerId) {
    query += " AND b.reader_id = (SELECT id FROM readers WHERE reader_id = ?)";
    params.push(readerId);
  }
  query += " LIMIT 1";

  const borrowing = db.prepare(query).get(...params) as { id: number } | undefined;
  if (!borrowing) return res.status(404).json({ error: "未找到该图书的活跃借阅记录" });

  try {
    const result = processReturn(borrowing.id);
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    res.status(404).json({ error: (e as Error).message });
  }
});

router.post("/renew", (req, res) => {
  const { borrowingId } = req.body;
  if (!borrowingId) return res.status(400).json({ error: "借阅记录 ID 为必填项" });

  const borrowing = db.prepare(`
    SELECT b.*, bk.title as book_title, r.name as reader_name
    FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    JOIN readers r ON r.id = b.reader_id
    WHERE b.id = ? AND b.returned_at IS NULL
  `).get(borrowingId) as {
    id: number; renewed_count: number; book_id: number; book_title: string; reader_name: string; status: string;
  } | undefined;
  if (!borrowing) return res.status(404).json({ error: "借阅记录不存在" });
  if (borrowing.status === "逾期") return res.status(400).json({ error: "逾期图书不可续借，请先归还" });

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

  db.prepare(`
    UPDATE borrowings SET due_date = ?, renewed_count = renewed_count + 1, status = '已续借'
    WHERE id = ?
  `).run(newDueDate, borrowingId);

  db.prepare(`
    INSERT INTO activities (type, book_title, reader_name, status)
    VALUES ('renew', ?, ?, '已续借')
  `).run(borrowing.book_title, borrowing.reader_name);

  res.json({ success: true, newDueDate, bookTitle: borrowing.book_title });
});

router.get("/overdue", (_req, res) => {
  const overdue = db.prepare(`
    SELECT b.id, b.borrowed_at, b.due_date, b.status,
      r.name as reader_name, r.reader_id, bk.title as book_title, bk.isbn
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
    SELECT b.id, b.borrowed_at, b.due_date, b.status, b.renewed_count,
      bk.title as book_title, bk.isbn, bk.id as book_id
    FROM borrowings b
    JOIN books bk ON bk.id = b.book_id
    WHERE b.reader_id = ? AND b.returned_at IS NULL
    ORDER BY b.due_date ASC
  `).all(reader.id);
  res.json(borrowings);
});

export default router;
