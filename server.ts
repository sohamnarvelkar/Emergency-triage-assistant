import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./src/db.js";
import cookieParser from "cookie-parser";
import crypto from "crypto";

// Note: uuid is not in package.json, I should add it or use crypto.randomUUID()
// crypto.randomUUID() is available in Node 14.17+

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Simple session store (in-memory for this demo, but linked to DB users)
  const sessions = new Map<string, string>();

  // API routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name } = req.body;
    
    // Hospital staff domain check
    const allowedDomains = ["hospital.com", "medical.org", "clinic.gov", "health.net"];
    const domain = email.split("@")[1];
    
    if (!domain || !allowedDomains.includes(domain.toLowerCase())) {
      return res.status(403).json({ 
        error: "Access Denied: Only authorized hospital staff with valid domains (@hospital.com, @medical.org, etc.) can register." 
      });
    }

    try {
      const id = crypto.randomUUID();
      const stmt = db.prepare("INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)");
      stmt.run(id, email, password, name);
      
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, id);
      res.cookie("sessionId", sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id, email, name });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Signup failed" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
    
    if (user) {
      const sessionId = crypto.randomUUID();
      sessions.set(sessionId, user.id);
      res.cookie("sessionId", sessionId, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ id: user.id, email: user.email, name: user.name });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      sessions.delete(sessionId);
      res.clearCookie("sessionId");
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const sessionId = req.cookies.sessionId;
    const userId = sessions.get(sessionId);
    if (userId) {
      const user: any = db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(userId);
      res.json(user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Triage History endpoints
  app.post("/api/triage", (req, res) => {
    const sessionId = req.cookies.sessionId;
    const userId = sessions.get(sessionId);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    const data = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO triage_history (
          id, user_id, age, heart_rate, systolic_blood_pressure, 
          oxygen_saturation, respiratory_rate, body_temperature, 
          pain_level, chronic_disease_count, previous_er_visits, 
          arrival_mode, symptoms, medical_history, triage_level, confidence, risk_factors, 
          explanation_summary, explanation_clinical_summary, explanation_top_features, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        data.id,
        userId,
        data.age,
        data.heart_rate,
        data.systolic_blood_pressure,
        data.oxygen_saturation,
        data.respiratory_rate,
        data.body_temperature,
        data.pain_level,
        data.chronic_disease_count,
        data.previous_er_visits,
        data.arrival_mode,
        data.symptoms,
        data.medical_history,
        data.triage_level,
        data.confidence,
        JSON.stringify(data.risk_factors),
        data.explanation.summary,
        data.explanation.clinical_summary,
        JSON.stringify(data.explanation.top_features),
        data.timestamp
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/triage", (req, res) => {
    const sessionId = req.cookies.sessionId;
    const userId = sessions.get(sessionId);
    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    try {
      const rows = db.prepare("SELECT * FROM triage_history WHERE user_id = ? ORDER BY timestamp DESC").all(userId);
      const history = rows.map((row: any) => ({
        ...row,
        risk_factors: JSON.parse(row.risk_factors),
        explanation: {
          summary: row.explanation_summary,
          clinical_summary: row.explanation_clinical_summary,
          top_features: JSON.parse(row.explanation_top_features)
        },
        time: new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
