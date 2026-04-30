require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");

const app = express();

app.use(cors());
app.use(express.json());

/* -----------------------------
   ROOT (HTML REQUIRED)
----------------------------- */
app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.send("<h1>States API is running</h1>");
});

/* -----------------------------
   IN-MEMORY FUN FACT STORE
----------------------------- */
const funFactsStore = {};

/* -----------------------------
   HELPER
----------------------------- */
const findState = (code) =>
  statesData.find((s) => s.code === code.toUpperCase());

/* -----------------------------
   VERIFY STATE
----------------------------- */
const verifyState = (req, res, next) => {
  const state = findState(req.params.state);

  if (!state) {
    return res.status(400).json({
      message: "Invalid state abbreviation parameter",
    });
  }

  req.stateData = state;
  req.code = state.code;
  next();
};

/* -----------------------------
   GET ALL STATES
----------------------------- */
app.get("/states", (req, res) => {
  let states = [...statesData];

  if (req.query.contig === "true") {
    states = states.filter((s) => s.code !== "AK" && s.code !== "HI");
  }

  if (req.query.contig === "false") {
    states = states.filter((s) => s.code === "AK" || s.code === "HI");
  }

  // merge funfacts
  states = states.map((state) => {
    const facts = funFactsStore[state.code];
    if (facts && facts.length > 0) {
      return { ...state, funfacts: facts };
    }
    return state;
  });

  res.json(states);
});

/* -----------------------------
   GET STATE
----------------------------- */
app.get("/states/:state", verifyState, (req, res) => {
  const facts = funFactsStore[req.code];

  if (facts && facts.length > 0) {
    return res.json({
      ...req.stateData,
      funfacts: facts,
    });
  }

  res.json(req.stateData);
});

/* -----------------------------
   GET FUN FACT
----------------------------- */
app.get("/states/:state/funfact", verifyState, (req, res) => {
  const facts = funFactsStore[req.code];

  if (!facts || facts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${req.stateData.state}`,
    });
  }

  const random = facts[Math.floor(Math.random() * facts.length)];

  res.json({ funfact: random });
});

/* -----------------------------
   POST FUN FACT
----------------------------- */
app.post("/states/:state/funfact", verifyState, (req, res) => {
  const { funfacts } = req.body;

  if (!funfacts) {
    return res.status(400).json({
      message: "State fun facts value required",
    });
  }

  if (!Array.isArray(funfacts)) {
    return res.status(400).json({
      message: "State fun facts value must be an array",
    });
  }

  if (!funFactsStore[req.code]) {
    funFactsStore[req.code] = [];
  }

  funFactsStore[req.code] = [
    ...funFactsStore[req.code],
    ...funfacts,
  ];

  res.json({
    ...req.stateData,
    funfacts: funFactsStore[req.code],
  });
});

/* -----------------------------
   PATCH FUN FACT
----------------------------- */
app.patch("/states/:state/funfact", verifyState, (req, res) => {
  const { index, funfact } = req.body;
  const facts = funFactsStore[req.code];

  if (!index) {
    return res.status(400).json({
      message: "State fun fact index value required",
    });
  }

  if (!funfact) {
    return res.status(400).json({
      message: "State fun fact value required",
    });
  }

  if (!facts || facts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${req.stateData.state}`,
    });
  }

  const i = index - 1;

  if (!facts[i]) {
    return res.status(400).json({
      message: `No Fun Fact found at that index for ${req.stateData.state}`,
    });
  }

  facts[i] = funfact;

  res.json({
    ...req.stateData,
    funfacts: facts,
  });
});

/* -----------------------------
   DELETE FUN FACT
----------------------------- */
app.delete("/states/:state/funfact", verifyState, (req, res) => {
  const { index } = req.body;
  const facts = funFactsStore[req.code];

  if (!index) {
    return res.status(400).json({
      message: "State fun fact index value required",
    });
  }

  if (!facts || facts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${req.stateData.state}`,
    });
  }

  const i = index - 1;

  if (!facts[i]) {
    return res.status(400).json({
      message: `No Fun Fact found at that index for ${req.stateData.state}`,
    });
  }

  facts.splice(i, 1);

  res.json({
    ...req.stateData,
    funfacts: facts,
  });
});

/* -----------------------------
   404 HANDLER (HTML)
----------------------------- */
app.use((req, res) => {
  res.status(404).set("Content-Type", "text/html");
  res.send("<h1>404 - Page Not Found</h1>");
});

/* -----------------------------
   START SERVER
----------------------------- */
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log("MongoDB error:", err));

