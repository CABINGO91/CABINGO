import express from "express";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(express.json());

// DATABASE CONNECTION (Render PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Cabingo API is running 🚀");
});

// HENT ALLE HYTTER
app.get("/cabins", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cabins");
    res.json(result.rows);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Fetch error");
  }
});

// LEGG TIL HYTTE
app.post("/cabins", async (req, res) => {
  const { name, location, lat, lng } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO cabins (name, location, lat, lng) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, location, lat, lng]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).send("Insert error");
  }
});

// SLETT HYTTE
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

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server kjører på port " + PORT);
});