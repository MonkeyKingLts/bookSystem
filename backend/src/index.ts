import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";
import { seedDb } from "./seed.js";
import { authMiddleware } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import booksRoutes from "./routes/books.js";
import readersRoutes from "./routes/readers.js";
import circulationRoutes from "./routes/circulation.js";
import reportsRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import notificationsRoutes from "./routes/notifications.js";
import searchRoutes from "./routes/search.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDb();
seedDb();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use(authMiddleware);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/readers", readersRoutes);
app.use("/api/circulation", circulationRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/search", searchRoutes);

const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) res.status(404).json({ message: "API server running. Start frontend dev server for UI." });
  });
});

app.listen(PORT, () => {
  console.log(`Lexis LMS API running on http://localhost:${PORT}`);
});
