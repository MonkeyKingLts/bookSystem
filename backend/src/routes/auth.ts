import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db.js";
import { authMiddleware, signToken } from "../middleware/auth.js";
import { logAudit } from "../utils/helpers.js";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "邮箱和密码为必填项" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as {
    id: number; email: string; name: string; role: string; password_hash: string;
  } | undefined;

  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logAudit("Failed Login Attempt", ip, "失败 (密码错误)");
    return res.status(401).json({ error: "邮箱或密码错误" });
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  logAudit("Admin Login", ip, "成功");

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.get("/me", authMiddleware, (req, res) => {
  const { user } = req as typeof req & { user: { userId: number } };
  const row = db.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(user.userId);
  if (!row) return res.status(404).json({ error: "用户不存在" });
  res.json(row);
});

router.post("/change-password", authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "当前密码和新密码为必填项" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "新密码至少 6 位" });
  }

  const { user } = req as typeof req & { user: { userId: number } };
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.userId) as { password_hash: string };
  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return res.status(400).json({ error: "当前密码错误" });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.userId);
  logAudit("Password Changed", req.socket.remoteAddress || "unknown", "成功");
  res.json({ success: true });
});

export default router;
