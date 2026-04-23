require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");

const app = express();

app.use(cors());
app.use(express.json());

/* -----------------------------
   ROOT ROUTE (HTML REQUIRED)
----------------------------- */
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>States API</title>
      </head>
      <body>
        <h1>States API is running</h1>
        <p>Use /states/:state to get state data</p>
      </body>
    </html>
  `);
});

/* -----------------------------
   VERIFY STATE MIDDLEWARE
----------------------------- */
const verifyState = (req, res, next) => {
  const stateCodes = statesData.map((s) => s.code);
  const stateCode = req.params.state.toUpperCase();

  if (!stateCodes.includes(stateCode)) {
    return res.status(400).json({ error: "Invalid state code" });
  }

  req.code = stateCode;
  next();
};

/* -----------------------------
   GET STATE
----------------------------- */
app.get("/states/:state", verifyState, (req, res) => {
  const stateData = statesData.find((s) => s.code === req.code);
  res.json(stateData);
});

/* -----------------------------
   404 HANDLER (REQUIRED HTML)
   MUST BE LAST
----------------------------- */
app.use((req, res) => {
  res.status(404);
  res.setHeader("Content-Type", "text/html");

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 Not Found</title>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p>The endpoint you are looking for does not exist.</p>
      </body>
    </html>
  `);
});

/* -----------------------------
   START SERVER (NO MONGO FOR NOW)
----------------------------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
