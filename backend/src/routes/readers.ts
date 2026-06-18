import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const { search, status, page = "1", limit = "10" } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  let where = "WHERE 1=1";
  const params: Record<string, string | number> = {};

  if (search) {
    where += " AND (name LIKE @search OR reader_id LIKE @search OR email LIKE @search)";
    params.search = `%${search}%`;
  }
  if (status && status !== "全部") {
    where += " AND status = @status";
    params.status = status as string;
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM readers ${where}`).get(params) as { c: number };
  const readers = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM borrowings b WHERE b.reader_id = r.id AND b.returned_at IS NULL) as current_borrowing
    FROM readers r ${where}
    ORDER BY r.joined_at DESC LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: limitNum, offset });

  res.json({ readers, total: total.c, page: pageNum, limit: limitNum });
});

router.get("/:id", (req, res) => {
  const reader = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM borrowings b WHERE b.reader_id = r.id AND b.returned_at IS NULL) as current_borrowing
    FROM readers r WHERE r.id = ?
  `).get(req.params.id);
  if (!reader) return res.status(404).json({ error: "读者不存在" });
  res.json(reader);
});

router.get("/by-reader-id/:readerId", (req, res) => {
  const reader = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM borrowings b WHERE b.reader_id = r.id AND b.returned_at IS NULL) as current_borrowing
    FROM readers r WHERE r.reader_id = ?
  `).get(req.params.readerId);
  if (!reader) return res.status(404).json({ error: "读者不存在" });
  res.json(reader);
});

router.post("/", (req, res) => {
  const { name, email, phone, student_id, reader_type, expiry_date } = req.body;
  if (!name) return res.status(400).json({ error: "姓名为必填项" });

  const count = db.prepare("SELECT COUNT(*) as c FROM readers").get() as { c: number };
  const readerId = `LIB-${String(8000 + count.c + 1)}-${String.fromCharCode(65 + (count.c % 26))}`;

  const limitMap: Record<string, string> = {
    "本科生": "max_books_undergrad",
    "研究生": "max_books_grad",
    "教职工": "max_books_faculty",
  };
  const limitKey = limitMap[reader_type || "本科生"] || "max_books_undergrad";
  const limitRow = db.prepare("SELECT value FROM settings WHERE key = ?").get(limitKey) as { value: string } | undefined;
  const borrowLimit = parseInt(limitRow?.value || "10", 10);

  const result = db.prepare(`
    INSERT INTO readers (reader_id, name, email, phone, student_id, reader_type, expiry_date, borrow_limit)
    VALUES (@reader_id, @name, @email, @phone, @student_id, @reader_type, @expiry_date, @borrow_limit)
  `).run({
    reader_id: readerId,
    name,
    email: email || null,
    phone: phone || null,
    student_id: student_id || null,
    reader_type: reader_type || "本科生",
    expiry_date: expiry_date || null,
    borrow_limit: borrowLimit,
  });

  res.status(201).json({ id: result.lastInsertRowid, reader_id: readerId });
});

router.put("/:id", (req, res) => {
  const { name, email, phone, student_id, reader_type, status, expiry_date } = req.body;
  const reader = db.prepare("SELECT * FROM readers WHERE id = ?").get(req.params.id);
  if (!reader) return res.status(404).json({ error: "读者不存在" });

  db.prepare(`
    UPDATE readers SET name=@name, email=@email, phone=@phone, student_id=@student_id,
    reader_type=@reader_type, status=@status, expiry_date=@expiry_date WHERE id=@id
  `).run({
    id: req.params.id,
    name: name ?? (reader as { name: string }).name,
    email: email ?? (reader as { email: string }).email,
    phone: phone ?? (reader as { phone: string }).phone,
    student_id: student_id ?? (reader as { student_id: string }).student_id,
    reader_type: reader_type ?? (reader as { reader_type: string }).reader_type,
    status: status ?? (reader as { status: string }).status,
    expiry_date: expiry_date ?? (reader as { expiry_date: string }).expiry_date,
  });

  res.json({ success: true });
});

export default router;
