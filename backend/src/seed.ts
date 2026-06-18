import { db } from "./db.js";
import bcrypt from "bcryptjs";

function seedUsers() {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (userCount.c > 0) return;
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)").run(
    "admin@lexiconlib.org", hash, "Dr. Eleanor Vance", "超级管理员"
  );
}

function seedNotifications() {
  const count = db.prepare("SELECT COUNT(*) as c FROM notifications").get() as { c: number };
  if (count.c > 0) return;
  const items = [
    { title: "逾期提醒", message: "当前有 1 本图书逾期未还，请及时处理", type: "warning" },
    { title: "系统更新", message: "图书管理系统已更新至最新版本", type: "info" },
    { title: "备份完成", message: "数据库自动备份已于今日凌晨完成", type: "success" },
  ];
  const insert = db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)");
  for (const n of items) insert.run(n.title, n.message, n.type);
}

export function seedDb() {
  seedUsers();
  seedNotifications();

  const bookCount = db.prepare("SELECT COUNT(*) as c FROM books").get() as { c: number };
  if (bookCount.c > 0) return;

  const books = [
    { title: "The Architect of Tomorrow", author: "Elena Rose", isbn: "978-0-123456-78-9", category: "文学", publisher: "Penguin", publish_date: "2022-03-15", quantity: 3, available: 2, location: "A区-1架-01", language: "英文", rating: 4.8, review_count: 124, cover_color: "#1A2B44" },
    { title: "The Principles of Mathematics", author: "Bertrand Russell", isbn: "978-0-987654-32-1", category: "科学", publisher: "Cambridge", publish_date: "1903-01-01", quantity: 2, available: 1, location: "B区-2架-05", language: "英文", rating: 4.9, review_count: 89, cover_color: "#64748B" },
    { title: "Introduction to Algorithms", author: "Thomas H. Cormen", isbn: "978-0-262033-84-8", category: "科学", publisher: "MIT Press", publish_date: "2009-07-31", quantity: 5, available: 3, location: "C区-1架-12", language: "英文", rating: 4.7, review_count: 256, cover_color: "#10B981" },
    { title: "The Architecture of Happiness", author: "Alain de Botton", isbn: "978-0-375724-38-2", category: "艺术", publisher: "Pantheon", publish_date: "2006-10-03", quantity: 2, available: 0, location: "D区-3架-02", language: "英文", rating: 4.5, review_count: 67, cover_color: "#1A2B44" },
    { title: "百年孤独", author: "加西亚·马尔克斯", isbn: "978-7-020111-56-7", category: "文学", publisher: "南海出版", publish_date: "2011-06-01", quantity: 4, available: 3, location: "A区-2架-08", language: "中文", rating: 4.9, review_count: 512, cover_color: "#64748B" },
    { title: "人类简史", author: "尤瓦尔·赫拉利", isbn: "978-7-508644-36-5", category: "历史", publisher: "中信出版", publish_date: "2014-11-01", quantity: 6, available: 4, location: "B区-1架-03", language: "中文", rating: 4.6, review_count: 890, cover_color: "#10B981" },
    { title: "Design Patterns", author: "Gang of Four", isbn: "978-0-201633-61-0", category: "科学", publisher: "Addison-Wesley", publish_date: "1994-10-21", quantity: 3, available: 2, location: "C区-2架-07", language: "英文", rating: 4.8, review_count: 345, cover_color: "#1A2B44" },
    { title: "艺术的故事", author: "贡布里希", isbn: "978-7-538259-30-9", category: "艺术", publisher: "广西美术", publish_date: "2008-04-01", quantity: 2, available: 2, location: "D区-1架-04", language: "中文", rating: 4.7, review_count: 178, cover_color: "#64748B" },
    { title: "Sapiens: A Brief History", author: "Yuval Noah Harari", isbn: "978-0-062315-00-7", category: "历史", publisher: "Harper", publish_date: "2015-02-10", quantity: 4, available: 1, location: "B区-3架-01", language: "英文", rating: 4.6, review_count: 423, cover_color: "#10B981" },
    { title: "Clean Code", author: "Robert C. Martin", isbn: "978-0-131235-08-4", category: "科学", publisher: "Prentice Hall", publish_date: "2008-08-01", quantity: 5, available: 3, location: "C区-3架-09", language: "英文", rating: 4.5, review_count: 567, cover_color: "#1A2B44" },
    { title: "红楼梦", author: "曹雪芹", isbn: "978-7-020111-00-0", category: "文学", publisher: "人民文学", publish_date: "1996-12-01", quantity: 8, available: 6, location: "A区-3架-02", language: "中文", rating: 4.9, review_count: 1200, cover_color: "#64748B" },
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", isbn: "978-0-374275-63-1", category: "科学", publisher: "Farrar Straus", publish_date: "2011-10-25", quantity: 3, available: 2, location: "C区-1架-15", language: "英文", rating: 4.4, review_count: 298, cover_color: "#10B981" },
  ];

  const insertBook = db.prepare(`
    INSERT INTO books (title, author, isbn, category, publisher, publish_date, quantity, available, location, language, rating, review_count, cover_color)
    VALUES (@title, @author, @isbn, @category, @publisher, @publish_date, @quantity, @available, @location, @language, @rating, @review_count, @cover_color)
  `);
  for (const b of books) insertBook.run(b);

  const readers = [
    { reader_id: "LIB-8842-A", name: "Eleanor Vance", email: "e.vance@lexicon-lib.edu", phone: "+1 (555) 234-5678", student_id: "STU-2021-001", reader_type: "研究生", status: "信用良好", borrow_limit: 15, fines: 0, expiry_date: "2026-06-30", joined_at: "2021-10-15", avatar_color: "#10B981" },
    { reader_id: "LIB-7721-B", name: "Julian R. Vance", email: "j.vance@university.edu", phone: "+1 (555) 345-6789", student_id: "STU-2022-042", reader_type: "研究生", status: "信用良好", borrow_limit: 15, fines: 0, expiry_date: "2026-08-31", joined_at: "2022-03-20", avatar_color: "#1A2B44" },
    { reader_id: "PAT-88402", name: "Sarah Jenkins", email: "s.jenkins@university.edu", phone: "+1 (555) 456-7890", student_id: "STU-2020-088", reader_type: "本科生", status: "信用良好", borrow_limit: 10, fines: 0, expiry_date: "2025-12-31", joined_at: "2020-09-01", avatar_color: "#64748B" },
    { reader_id: "LIB-5503-C", name: "Marcus Chen", email: "m.chen@university.edu", phone: "+1 (555) 567-8901", student_id: "STU-2023-015", reader_type: "本科生", status: "有逾期未还", borrow_limit: 10, fines: 12.5, expiry_date: "2025-06-30", joined_at: "2023-01-10", avatar_color: "#F59E0B" },
    { reader_id: "LIB-3301-D", name: "Amelia Hart", email: "a.hart@university.edu", phone: "+1 (555) 678-9012", student_id: "STU-2019-056", reader_type: "教职工", status: "账户已封禁", borrow_limit: 20, fines: 85.0, expiry_date: "2027-12-31", joined_at: "2019-04-15", avatar_color: "#EF4444" },
  ];

  const insertReader = db.prepare(`
    INSERT INTO readers (reader_id, name, email, phone, student_id, reader_type, status, borrow_limit, fines, expiry_date, joined_at, avatar_color)
    VALUES (@reader_id, @name, @email, @phone, @student_id, @reader_type, @status, @borrow_limit, @fines, @expiry_date, @joined_at, @avatar_color)
  `);
  for (const r of readers) insertReader.run(r);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const dueStr = dueDate.toISOString().split("T")[0];

  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 5);
  const overdueStr = overdueDate.toISOString().split("T")[0];

  const borrowings = [
    { reader_id: 2, book_id: 4, due_date: dueStr, status: "已借出" },
    { reader_id: 2, book_id: 9, due_date: dueStr, status: "已借出" },
    { reader_id: 2, book_id: 3, due_date: dueStr, status: "已借出" },
    { reader_id: 3, book_id: 1, due_date: dueStr, status: "已借出" },
    { reader_id: 4, book_id: 2, due_date: overdueStr, status: "逾期" },
  ];

  const insertBorrowing = db.prepare(`
    INSERT INTO borrowings (reader_id, book_id, due_date, status) VALUES (@reader_id, @book_id, @due_date, @status)
  `);
  for (const b of borrowings) insertBorrowing.run(b);

  const activities = [
    { type: "return", book_title: "The Principles of Mathematics", reader_name: "Eleanor Vance", status: "已还" },
    { type: "borrow", book_title: "Introduction to Algorithms", reader_name: "Julian R. Vance", status: "已借出" },
    { type: "return", book_title: "百年孤独", reader_name: "Sarah Jenkins", status: "已还" },
    { type: "borrow", book_title: "The Architecture of Happiness", reader_name: "Marcus Chen", status: "已借出" },
    { type: "renew", book_title: "人类简史", reader_name: "Eleanor Vance", status: "已续借" },
  ];

  const insertActivity = db.prepare(`
    INSERT INTO activities (type, book_title, reader_name, status) VALUES (@type, @book_title, @reader_name, @status)
  `);
  for (const a of activities) insertActivity.run(a);

  const settings: Record<string, string> = {
    library_name: "Lexicon Central Library",
    branch_id: "BR-CEN-01",
    address: "100 Knowledge Parkway",
    contact_email: "admin@lexiconlib.org",
    contact_phone: "+1 (555) 019-2837",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    backup_frequency: "weekly",
    last_backup: "2023-10-24T03:00:00+08:00",
    borrow_days: "14",
    max_renewals: "2",
    overdue_fine_per_day: "0.5",
    max_books_undergrad: "10",
    max_books_grad: "15",
    max_books_faculty: "20",
    mfa_enabled: "true",
    session_timeout: "30",
    notify_overdue: "true",
    notify_reservation: "true",
    notify_maintenance: "false",
    email_enabled: "true",
    sms_enabled: "true",
    push_enabled: "false",
    email_template_subject: "通知：图书逾期 - {{library_name}}",
    email_template_body: "尊敬的 {{patron_name}}，您账户中以下借阅图书已逾期：\n\n{{item_list}}\n\n请尽快归还。",
    max_emails_per_day: "3",
    overdue_reminder_interval: "7",
    admin_name: "Dr. Eleanor Vance",
    admin_email: "e.vance@lexicon-lib.edu",
    admin_role: "超级管理员",
  };

  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(settings)) {
    insertSetting.run(key, value);
  }

  const ipList = [
    { name: "主校区网络", ip_range: "192.168.1.0/24" },
    { name: "馆长居家办公", ip_range: "203.0.113.42" },
    { name: "管理员 VPN 网关", ip_range: "10.0.0.5" },
  ];
  const insertIp = db.prepare("INSERT INTO ip_whitelist (name, ip_range) VALUES (?, ?)");
  for (const ip of ipList) insertIp.run(ip.name, ip.ip_range);

  const logs = [
    { event_type: "Admin Login", ip_address: "192.168.1.45", status: "成功" },
    { event_type: "Failed Login Attempt", ip_address: "45.22.109.12", status: "失败 (密码错误)" },
    { event_type: "IP Whitelist Updated", ip_address: "192.168.1.45", status: "成功" },
    { event_type: "Admin Login", ip_address: "10.0.0.5", status: "成功" },
    { event_type: "Settings Updated", ip_address: "192.168.1.45", status: "成功" },
  ];
  const insertLog = db.prepare("INSERT INTO audit_logs (event_type, ip_address, status) VALUES (?, ?, ?)");
  for (const log of logs) insertLog.run(log.event_type, log.ip_address, log.status);
}
