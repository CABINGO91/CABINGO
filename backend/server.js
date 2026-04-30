require("dotenv").config();require("dotenv").config();

console.log("KEY:", process.env.STRIPE_SECRET_KEY);

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

console.log("🚀 Server starter...");

// TEST ROUTE (valgfri men nyttig)
app.get("/", (req, res) => {
  res.send("Backend kjører!");
});

// 🔥 STRIPE CHECKOUT ROUTE
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { name, price } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: {
              name: name,
            },
            unit_amount: price * 100, // Stripe bruker øre
          },
          quantity: 1,
        },
      ],
      success_url: "http://127.0.0.1:5500/app/success.html",
      cancel_url: "http://127.0.0.1:5500/app/cancel.html",
    });

    res.json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Noe gikk galt" });
  }
});

// PORT (viktig for Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 Server kjører på port ${PORT}`);
});