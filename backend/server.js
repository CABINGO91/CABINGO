const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 DATABASE
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cabingo",
  password: "957raire", // ← ditt postgres passord
  port: 5432,
});

// 🔐 AUTH
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Ikke logget inn" });
  }

  try {
    jwt.verify(token, "secret");
    next();
  } catch {
    res.status(403).json({ error: "Ugyldig token" });
  }
}

// 🔑 LOGIN (ENKEL – UTEN BCRYPT)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 🔥 HARDKODET LOGIN
  if (email === "admin@test.no" && password === "957raire") {
    const token = jwt.sign({ user: email }, "secret");
    return res.json({ token });
  }

  res.status(401).json({ error: "Feil login" });
});

// 📦 GET cabins
app.get("/cabins", async (req, res) => {
  const result = await pool.query("SELECT * FROM cabins ORDER BY id DESC");
  res.json(result.rows);
});

// ➕ POST cabin (krever login)
app.post("/cabins", auth, async (req, res) => {
  const { name, location, lat, lng } = req.body;

  await pool.query(
    "INSERT INTO cabins (name, location, lat, lng) VALUES ($1, $2, $3, $4)",
    [name, location, lat, lng]
  );

  res.json({ success: true });
});

// ❌ DELETE cabin (krever login)
app.delete("/cabins/:id", auth, async (req, res) => {
  const { id } = req.params;

  await pool.query("DELETE FROM cabins WHERE id = $1", [id]);

  res.json({ success: true });
});

// 🚀 START
app.listen(3000, () => {
  console.log("Server kjører på http://localhost:3000");
});