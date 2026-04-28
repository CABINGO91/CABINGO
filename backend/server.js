const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DATABASE CONNECTION (Render fix med SSL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Cabingo backend is running 🚀");
});

app.get("/cabins", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cabins");
    res.json(result.rows);
  } catch (err) {
    console.error("FULL ERROR:", err);
    res.status(500).send(err.message); // 👈 dette er key
  }
});

// ✅ LEGG TIL HYTTE
app.post("/cabins", async (req, res) => {
  const { name, location, price } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO cabins (name, location, price) VALUES ($1, $2, $3) RETURNING *",
      [name, location, price]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Insert error");
  }
});

// ✅ SLETT HYTTE
app.delete("/cabins/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM cabins WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Delete error");
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server kjører på port " + PORT);
});res.status(500).send(err.message);
