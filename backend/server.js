const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// 🔗 Database connection (Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ==========================
// 🏠 CABINS
// ==========================

// GET alle hytter
app.get("/cabins", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cabins ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET CABINS ERROR:", err);
    res.status(500).send(err.message);
  }
});

// POST ny hytte
app.post("/cabins", async (req, res) => {
  const { name, location, price, image, lat, lng } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO cabins (name, location, price, image, lat, lng)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, location, price, image, lat, lng]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("POST CABIN ERROR:", err);
    res.status(500).send(err.message);
  }
});

// DELETE hytte
app.delete("/cabins/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM cabins WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE CABIN ERROR:", err);
    res.status(500).send(err.message);
  }
});

// ==========================
// 📅 BOOKINGS
// ==========================

// POST booking
app.post("/bookings", async (req, res) => {
  const { cabin_id, name, from_date, to_date } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO bookings (cabin_id, name, from_date, to_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cabin_id, name, from_date, to_date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("BOOKING ERROR:", err);
    res.status(500).send(err.message);
  }
});

// GET bookings for en hytte
app.get("/bookings/:cabin_id", async (req, res) => {
  const { cabin_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM bookings WHERE cabin_id = $1",
      [cabin_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET BOOKINGS ERROR:", err);
    res.status(500).send(err.message);
  }
});

// ==========================
// 🚀 START SERVER
// ==========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server kjører på port " + PORT);
});const stripe = new Stripe("sk_test_sk_test_51TRJAZCz7vZpGxOL3SXFbl2PzTEeAPJqqLnZkkVNOdaA05DgcanLUF7Qx4f3B6J47RoKaTAS68qwqUUrNJLbpeFN00EVGGH6pp");