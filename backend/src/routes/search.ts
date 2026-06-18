import { Router } from "express";
import { db } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return res.json({ books: [], readers: [] });

  const books = db.prepare(
    "SELECT id, title, author, isbn FROM books WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ? LIMIT 5"
  ).all(`%${q}%`, `%${q}%`, `%${q}%`);

  const readers = db.prepare(
    "SELECT id, name, reader_id, email FROM readers WHERE name LIKE ? OR reader_id LIKE ? OR email LIKE ? LIMIT 5"
  ).all(`%${q}%`, `%${q}%`, `%${q}%`);

  res.json({ books, readers });
});

export default router;
