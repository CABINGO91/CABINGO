const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const app = express();

// 🔐 KEYS (BYTT DISSE)
const stripe = Stripe("sk_test_51TRJAZCz7vZpGxOL3SXFbl2PzTEeAPJqqLnZkkVNOdaA05DgcanLUF7Qx4f3B6J47RoKaTAS68qwqUUrNJLbpeFN00EVGGH6pp");
const WEBHOOK_SECRET = "whsec_N5eTRdPwhW0uwotI40yrbDCCHtOwG3Hk";

// Middleware
app.use(cors());
app.use(express.json());

// ⚠️ VIKTIG for webhook
app.use("/webhook", bodyParser.raw({ type: "application/json" }));

// =========================
// 🗄 DATABASE (Render/Postgres)
// =========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// =========================
// 🏡 GET CABINS
// =========================
app.get("/cabins", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cabins ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET CABINS ERROR:", err);
    res.status(500).send(err.message);
  }
});

// =========================
// 💳 CREATE STRIPE CHECKOUT
// =========================
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { cabin } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: {
              name: cabin.name,
            },
            unit_amount: cabin.price * 100,
          },
          quantity: 1,
        },
      ],

      success_url: "https://din-app.onrender.com?success=true",
      cancel_url: "https://din-app.onrender.com?cancel=true",

      // 🔥 SEND DATA TIL WEBHOOK
      metadata: {
        cabin_id: cabin.id,
        start_date: "2026-06-01",
        end_date: "2026-06-05",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("STRIPE ERROR:", err);
    res.status(500).send(err.message);
  }
});

// =========================
// 🔔 WEBHOOK (STRIPE → DB)
// =========================
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      WEBHOOK_SECRET
    );
  } catch (err) {
    console.log("❌ Webhook error:", err.message);
    return res.sendStatus(400);
  }

  // ✅ BETALING FULLFØRT
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const cabinId = session.metadata.cabin_id;
    const startDate = session.metadata.start_date;
    const endDate = session.metadata.end_date;
    const amount = session.amount_total;

    try {
      // 📅 Lagre booking
      await pool.query(
        `INSERT INTO bookings (cabin_id, start_date, end_date)
         VALUES ($1, $2, $3)`,
        [cabinId, startDate, endDate]
      );

      // 💳 Lagre betaling
      await pool.query(
        `INSERT INTO payments (cabin_id, amount, stripe_session_id, status)
         VALUES ($1, $2, $3, $4)`,
        [cabinId, amount, session.id, "paid"]
      );

      console.log("✅ Booking + betaling lagret!");
    } catch (err) {
      console.log("❌ DB ERROR:", err);
    }
  }

  res.json({ received: true });
});

// =========================
// 🚀 START SERVER
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server kjører på port " + PORT);
});