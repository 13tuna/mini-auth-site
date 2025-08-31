import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";       // ✅ güvenlik başlıkları
import fs from "fs";
import https from "https";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "devsecret_change_me";
const COOKIE_NAME = "token";
const isProd = process.env.NODE_ENV === "production";

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false }));  // ✅ güvenlik başlıkları
if (isProd) {
  app.set("trust proxy", 1);  // proxy arkasında https algılasın
}

// DB setup
const db = new Database(path.join(__dirname, "auth.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Helpers
function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
}

function authRequired(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ ok: false, error: "Oturum bulunamadı." });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Oturum süresi dolmuş veya geçersiz." });
  }
}

// Tek cookie ayarı (HTTP-only, secure vs.)
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd || process.env.LOCAL_HTTPS === "true", // ✅ prod veya local https
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

// Routes - API
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ ok: false, error: "Tüm alanları doldurun." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ ok: false, error: "Geçerli bir e-posta girin." });
    if (password.length < 6) return res.status(400).json({ ok: false, error: "Şifre en az 6 karakter olmalı." });

    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) return res.status(409).json({ ok: false, error: "Bu e-posta zaten kayıtlı." });

    const hash = await bcrypt.hash(password, 10);
    const info = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)").run(name, email, hash);
    const user = { id: info.lastInsertRowid, name, email };
    const token = makeToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Sunucu hatası." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ ok: false, error: "E-posta ve şifre gerekli." });

    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row) return res.status(401).json({ ok: false, error: "E-posta veya şifre hatalı." });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "E-posta veya şifre hatalı." });

    const user = { id: row.id, name: row.name, email: row.email };
    const token = makeToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions());
    return res.json({ ok: true, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Sunucu hatası." });
  }
});

app.get("/api/me", authRequired, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Dinleme
if (process.env.LOCAL_HTTPS === "true") {
  // 🔒 Yerel HTTPS (mkcert ile sertifika oluşturduysan)
  const key = fs.readFileSync("./localhost-key.pem");
  const cert = fs.readFileSync("./localhost.pem");
  https.createServer({ key, cert }, app).listen(PORT, () => {
    console.log(`✅ HTTPS server running on https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`✅ HTTP server running on http://localhost:${PORT}`);
  });
}
