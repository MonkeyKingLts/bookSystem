# Lexis 图书管理系统

基于设计稿实现的现代化图书馆管理系统，包含仪表盘、图书目录、读者中心、借阅管理、报表中心和系统设置等完整功能模块。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | SQLite (better-sqlite3) |

## 功能模块

- **仪表盘** — 馆藏统计、借阅趋势图、快速操作、最近动态
- **图书目录** — 图书网格展示、搜索筛选、添加新书
- **读者中心** — 读者列表、状态管理、注册读者
- **借阅管理** — 借出/归还/续借/逾期、扫描读者 ID 和 ISBN
- **报表中心** — KPI 指标、借阅趋势、分类分布、运营日志
- **系统设置** — 通用设置、借阅规则、账户安全、通知配置

## 快速开始

```bash
# 安装依赖
npm install
cd backend && npm install
cd ../frontend && npm install

# 同时启动前后端
cd .. && npm run dev
```

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001/api

## 设计规范

- 主色: `#1A2B44`
- 辅助色: `#64748B`
- 强调色: `#10B981`
- 背景色: `#F8FAFC`
- 字体: Manrope (标题) / Inter (正文) / JetBrains Mono (标签)

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/stats` | 仪表盘统计 |
| GET | `/api/books` | 图书列表 |
| POST | `/api/books` | 添加图书 |
| GET | `/api/readers` | 读者列表 |
| POST | `/api/readers` | 注册读者 |
| POST | `/api/circulation/checkout` | 借出图书 |
| POST | `/api/circulation/return` | 归还图书 |
| GET | `/api/reports/overview` | 报表概览 |
| GET/PUT | `/api/settings` | 系统设置 |
