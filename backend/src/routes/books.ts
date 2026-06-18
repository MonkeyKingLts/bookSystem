import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { search, category, status, language, page = "1", limit = "12" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  let where = "WHERE 1=1";
  const params: Record<string, string | number> = {};

  if (search) {
    where += " AND (title LIKE @search OR author LIKE @search OR isbn LIKE @search)";
    params.search = `%${search}%`;
  }
  if (category && category !== "所有分类") {
    where += " AND category = @category";
    params.category = category as string;
  }
  if (language && language !== "所有语言") {
    where += " AND language = @language";
    params.language = language as string;
  }
  if (status === "可借阅") {
    where += " AND available > 0";
  } else if (status === "已借出") {
    where += " AND available = 0";
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM books ${where}`).get(params) as { c: number };
  const books = db.prepare(`SELECT * FROM books ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`).all({
    ...params,
    limit: limitNum,
    offset,
  });

  res.json({ books, total: total.c, page: pageNum, limit: limitNum });
});

router.get("/categories", (_req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM books ORDER BY category").all();
  res.json(categories.map((c) => (c as { category: string }).category));
});

router.get("/by-isbn/:isbn", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE isbn = ?").get(req.params.isbn);
  if (!book) return res.status(404).json({ error: "图书不存在" });
  res.json(book);
});

router.get("/:id", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "图书不存在" });
  res.json(book);
});

router.post("/", (req, res) => {
  const { title, author, isbn, category, publisher, publish_date, quantity, location } = req.body;
  if (!title || !author) return res.status(400).json({ error: "书名和作者为必填项" });

  try {
    const result = db.prepare(`
      INSERT INTO books (title, author, isbn, category, publisher, publish_date, quantity, available, location)
      VALUES (@title, @author, @isbn, @category, @publisher, @publish_date, @quantity, @quantity, @location)
    `).run({
      title,
      author,
      isbn: isbn || null,
      category: category || "其他",
      publisher: publisher || null,
      publish_date: publish_date || null,
      quantity: quantity || 1,
      location: location || null,
    });

    db.prepare("INSERT INTO activities (type, book_title, reader_name, status) VALUES ('add', ?, '系统', '已入库')").run(title);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "ISBN 已存在" });
    }
    throw e;
  }
});

router.put("/:id", (req, res) => {
  const { title, author, isbn, category, publisher, publish_date, quantity, location } = req.body;
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "图书不存在" });

  const borrowed = (book as { quantity: number; available: number }).quantity - (book as { available: number }).available;
  const newQty = quantity ?? (book as { quantity: number }).quantity;

  db.prepare(`
    UPDATE books SET title=@title, author=@author, isbn=@isbn, category=@category,
    publisher=@publisher, publish_date=@publish_date, quantity=@quantity,
    available=@available, location=@location WHERE id=@id
  `).run({
    id: req.params.id,
    title: title ?? (book as { title: string }).title,
    author: author ?? (book as { author: string }).author,
    isbn: isbn ?? (book as { isbn: string }).isbn,
    category: category ?? (book as { category: string }).category,
    publisher: publisher ?? (book as { publisher: string }).publisher,
    publish_date: publish_date ?? (book as { publish_date: string }).publish_date,
    quantity: newQty,
    available: Math.max(0, newQty - borrowed),
    location: location ?? (book as { location: string }).location,
  });

  res.json({ success: true });
});

router.delete("/:id", (req, res) => {
  const active = db.prepare("SELECT COUNT(*) as c FROM borrowings WHERE book_id = ? AND returned_at IS NULL").get(req.params.id) as { c: number };
  if (active.c > 0) return res.status(400).json({ error: "该图书有未归还的借阅记录" });

  db.prepare("DELETE FROM books WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
