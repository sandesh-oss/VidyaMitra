import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "vidyamitra-secret-key";

// Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Database Setup
const db = new Database("vidyamitra.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    career_goals TEXT,
    bio TEXT,
    is_verified INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS otps (
    email TEXT PRIMARY KEY,
    otp TEXT,
    expires_at DATETIME
  );
`);

// Ensure new columns exist (Migration)
const columns = db.prepare("PRAGMA table_info(users)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes("career_goals")) {
  db.prepare("ALTER TABLE users ADD COLUMN career_goals TEXT").run();
}
if (!columnNames.includes("bio")) {
  db.prepare("ALTER TABLE users ADD COLUMN bio TEXT").run();
}
if (!columnNames.includes("is_verified")) {
  db.prepare("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0").run();
}

db.exec(`
  CREATE TABLE IF NOT EXISTS resume_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    score INTEGER,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skill_gaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    skill TEXT,
    score INTEGER,
    total INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    feedback TEXT,
    scores TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- API Routes ---

// OTP Generation
app.post("/api/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Check if user already exists and is verified
  const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
  if (existingUser && existingUser.is_verified) {
    return res.status(400).json({ error: "Email already registered. Please sign in." });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  try {
    db.prepare("INSERT OR REPLACE INTO otps (email, otp, expires_at) VALUES (?, ?, ?)")
      .run(email, otp, expiresAt.toISOString());
    
    // Send Email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"VidyāMitra" <noreply@vidyamitra.ai>',
        to: email,
        subject: "VidyāMitra - Your Verification Code",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #10b981; text-align: center;">VidyāMitra</h2>
            <p>Hello,</p>
            <p>Thank you for joining VidyāMitra. Use the following code to verify your email address:</p>
            <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #0f172a; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; 2026 VidyāMitra AI Career Agent</p>
          </div>
        `,
      });
      res.json({ success: true, message: "OTP sent to your email." });
    } else {
      // In production, we must have SMTP configured
      console.error("[CRITICAL] SMTP not configured. Cannot send OTP.");
      res.status(500).json({ error: "Email service is temporarily unavailable. Please contact support." });
    }
  } catch (error: any) {
    console.error("Email error:", error);
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, otp } = req.body;
  
  if (!password || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }

  // Verify OTP
  const otpRecord: any = db.prepare("SELECT * FROM otps WHERE email = ?").get(email);
  if (!otpRecord || otpRecord.otp !== otp || new Date(otpRecord.expires_at) < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const stmt = db.prepare("INSERT INTO users (email, password, name, is_verified) VALUES (?, ?, ?, 1)");
    const info = stmt.run(email, hashedPassword, name);
    
    // Clear OTP
    db.prepare("DELETE FROM otps WHERE email = ?").run(email);

    const token = jwt.sign({ id: info.lastInsertRowid, email, name }, JWT_SECRET);
    res.json({ token, user: { id: info.lastInsertRowid, email, name } });
  } catch (e) {
    res.status(400).json({ error: "Registration failed. Email might be in use." });
  }
});

app.post("/api/auth/update-profile", authenticateToken, async (req: any, res) => {
  const { name, bio, career_goals } = req.body;
  try {
    db.prepare("UPDATE users SET name = ?, bio = ?, career_goals = ? WHERE id = ?")
      .run(name, bio, career_goals, req.user.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/full-profile", authenticateToken, (req: any, res) => {
  const user = db.prepare("SELECT id, email, name, bio, career_goals FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});
app.post("/api/resume/save", authenticateToken, async (req: any, res) => {
  const evaluation = req.body;
  try {
    db.prepare("INSERT INTO resume_evaluations (user_id, score, data) VALUES (?, ?, ?)")
      .run(req.user.id, evaluation.score || 0, JSON.stringify(evaluation));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Skill Gap Save
app.post("/api/skills/save", authenticateToken, async (req: any, res) => {
  const { role, data } = req.body;
  try {
    db.prepare("INSERT INTO skill_gaps (user_id, role, data) VALUES (?, ?, ?)")
      .run(req.user.id, role, JSON.stringify(data));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Training Plan Save
app.post("/api/training/save", authenticateToken, async (req: any, res) => {
  const { role, data } = req.body;
  try {
    db.prepare("INSERT INTO training_plans (user_id, role, data) VALUES (?, ?, ?)")
      .run(req.user.id, role, JSON.stringify(data));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Quiz Result Save
app.post("/api/quiz/save", authenticateToken, async (req: any, res) => {
  const { skill, score, total } = req.body;
  try {
    db.prepare("INSERT INTO quiz_results (user_id, skill, score, total) VALUES (?, ?, ?, ?)")
      .run(req.user.id, skill, score, total);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Interview Save
app.post("/api/interview/save", authenticateToken, async (req: any, res) => {
  const { role, evaluation } = req.body;
  try {
    db.prepare("INSERT INTO interview_sessions (user_id, role, feedback, scores) VALUES (?, ?, ?, ?)")
      .run(req.user.id, role, evaluation.feedback, JSON.stringify(evaluation.scores));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AI Services moved to frontend

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/auth/profile", authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// Delete Account
app.delete("/api/auth/delete-account", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  try {
    // Start a transaction to delete all user data
    const deleteUser = db.transaction(() => {
      db.prepare("DELETE FROM resume_evaluations WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM skill_gaps WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM training_plans WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM quiz_results WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM interview_sessions WHERE user_id = ?").run(userId);
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    });

    deleteUser();
    res.json({ success: true, message: "Account and all associated data deleted successfully." });
  } catch (error: any) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account. Please try again later." });
  }
});

// AI Services moved to frontend

app.get("/api/skills/history", authenticateToken, (req: any, res) => {
  try {
    const history = db.prepare("SELECT * FROM skill_gaps WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(history.map((h: any) => ({
      ...h,
      data: JSON.parse(h.data)
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch skill gap history" });
  }
});

// Dashboard Data
app.get("/api/dashboard", authenticateToken, (req: any, res) => {
  const userId = req.user.id;
  const resume = db.prepare("SELECT * FROM resume_evaluations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId);
  const skillGap = db.prepare("SELECT * FROM skill_gaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId);
  const training = db.prepare("SELECT * FROM training_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(userId);
  const quizzes = db.prepare("SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC").all(userId);
  const interviews = db.prepare("SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC").all(userId);

  res.json({
    latest_resume: resume ? { ...resume, data: safeParse(resume.data as string) } : null,
    latest_skills: skillGap ? { ...skillGap, data: safeParse(skillGap.data as string) } : null,
    latest_training: training ? { ...training, data: safeParse(training.data as string) } : null,
    quizzes,
    interviews: interviews.map((i: any) => ({ ...i, scores: safeParse(i.scores as string) }))
  });
});

function safeParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
