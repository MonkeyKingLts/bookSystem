# Lexis 图书管理系统

基于设计稿实现的现代化图书馆管理系统，包含完整的认证、借阅流通、条码扫描、PDF 导出等功能。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + html5-qrcode + jsPDF |
| 后端 | Node.js + Express + TypeScript + JWT 认证 |
| 数据库 | SQLite (better-sqlite3) |

## 功能模块

- **登录认证** — JWT 令牌、受保护 API、修改密码、退出登录
- **仪表盘** — 馆藏统计、借阅趋势图、快速操作、最近动态
- **图书目录** — 网格展示、搜索筛选、添加/编辑/删除、ISBN 条码扫描
- **读者中心** — 列表、搜索、状态筛选、注册/编辑读者
- **借阅管理** — 借出/归还/续借/逾期、摄像头条码扫描、PDF 借书收据
- **报表中心** — 真实 KPI 数据、趋势图、分类分布、PDF 导出
- **系统设置** — 通用/借阅/安全/通知配置、IP 白名单、手动备份

## 快速开始

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd .. && npm run dev
```

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api

## 默认管理员账号

- 邮箱: `admin@lexiconlib.org`
- 密码: `admin123`

## 新增功能说明

### 用户登录认证
所有 API（除 `/api/auth/login`）需要 Bearer Token。前端自动在请求头附带 JWT，未登录跳转登录页。

### 真实条码扫描
使用 `html5-qrcode` 调用设备摄像头扫描 ISBN/条形码，集成于借阅管理和图书目录。无摄像头时可手动输入。

### PDF 导出
- **借书收据**: 借出成功后点击「下载借书收据 (PDF)」
- **运营报表**: 报表中心点击「导出报告 (PDF)」，支持服务端/客户端双模式

### 逾期与罚金
系统自动检测逾期状态，归还逾期图书时按设置中的每日罚金自动计算。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 管理员登录 |
| GET | `/api/auth/me` | 当前用户信息 |
| POST | `/api/auth/change-password` | 修改密码 |
| GET | `/api/dashboard/stats` | 仪表盘统计 |
| GET | `/api/books/by-isbn/:isbn` | 按 ISBN 查询 |
| POST | `/api/circulation/checkout` | 借出图书 |
| POST | `/api/circulation/return-by-isbn` | 按 ISBN 归还 |
| GET | `/api/reports/export/pdf` | 导出 PDF 报表 |
| GET | `/api/notifications` | 系统通知 |
| GET | `/api/search?q=` | 全局搜索 |
