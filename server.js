require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");
const State = require("./models/States");

const app = express();
const funFactsStore = {};

app.use(cors());
app.use(express.json());

/* =========================================================
   ROOT (HTML REQUIRED)
========================================================= */
app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.send("<h1>States API is running</h1>");
});

/* =========================================================
   404 HANDLER
========================================================= */
app.use((req, res) => {
  res.status(404).set("Content-Type", "text/html");
  res.send("<h1>404 - Not Found</h1>");
});

/* =========================================================
   STATES ENDPOINT
========================================================= */
app.get("/states", (req, res) => {
  let result = [...statesData];

  if (req.query.contig === "true") {
    result = result.filter((s) => s.code !== "AK" && s.code !== "HI");
  }

  if (req.query.contig === "false") {
    result = result.filter((s) => s.code === "AK" || s.code === "HI");
  }

  res.json(result);
});

/* =========================================================
   VALIDATION MIDDLEWARE
========================================================= */
const validCodes = statesData.map((s) => s.code);

const verifyState = (req, res, next) => {
  const code = req.params.state.toUpperCase();

  if (!validCodes.includes(code)) {
    return res.status(400).json({
      message: "Invalid state abbreviation parameter"
    });
  }

  req.code = code;
  next();
};

/* =========================================================
   GET STATE
========================================================= */
app.get("/states/:state", verifyState, (req, res) => {
  const code = req.code;
  const baseState = req.stateData;

  const funfacts = funFactsStore[code];

  if (funfacts && funfacts.length > 0) {
    return res.json({
      ...baseState,
      funfacts: funfacts,
    });
  }

  res.json(baseState);
});

/* =========================================================
   CAPITAL
========================================================= */
app.get("/states/:state/capital", verifyState, (req, res) => {
  const state = statesData.find((s) => s.code === req.code);

  res.json({
    state: state.code,
    capital: state.capital_city
  });
});

/* =========================================================
   NICKNAME
========================================================= */
app.get("/states/:state/nickname", verifyState, (req, res) => {
  const state = statesData.find((s) => s.code === req.code);

  res.json({
    state: state.code,
    nickname: state.nickname
  });
});

/* =========================================================
   POPULATION
========================================================= */
app.get("/states/:state/population", verifyState, (req, res) => {
  const state = statesData.find((s) => s.code === req.code);

  res.json({
    state: state.code,
    population: state.population.toLocaleString()
  });
});

/* =========================================================
   ADMISSION
========================================================= */
app.get("/states/:state/admission", verifyState, (req, res) => {
  const state = statesData.find((s) => s.code === req.code);

  res.json({
    state: state.code,
    admitted: state.admission_date
  });
});

/* =========================================================
   FUN FACT GET (Mongo FIRST, fallback JSON)
========================================================= */
app.get("/states/:state/funfact", verifyState, async (req, res) => {
  const mongoState = await State.findOne({ stateCode: req.code });

  if (mongoState && mongoState.funfacts.length > 0) {
    const random =
      mongoState.funfacts[Math.floor(Math.random() * mongoState.funfacts.length)];

    return res.json({ funfact: random });
  }

  const state = statesData.find((s) => s.code === req.code);

  if (!state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${state.state}`
    });
  }

  const random =
    state.funfacts[Math.floor(Math.random() * state.funfacts.length)];

  res.json({ funfact: random });
});

/* =========================================================
   POST FUNFACT
========================================================= */
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

  const code = req.code;

  if (!funFactsStore[code]) {
    funFactsStore[code] = [];
  }

  funFactsStore[code] = [
    ...funFactsStore[code],
    ...funfacts,
  ];

  res.json({
    ...req.stateData,
    funfacts: funFactsStore[code],
  });
});

/* =========================================================
   PATCH FUNFACT
========================================================= */
app.patch("/states/:state/funfact", verifyState, async (req, res) => {
  const { index, funfact } = req.body;

  if (!index) {
    return res.status(400).json({
      message: "State fun fact index value required"
    });
  }

  if (!funfact || typeof funfact !== "string") {
    return res.status(400).json({
      message: "State fun fact value required"
    });
  }

  const state = await State.findOne({ stateCode: req.code });

  if (!state || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${req.code}`
    });
  }

  const i = index - 1;

  if (i < 0 || i >= state.funfacts.length) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${req.code}`
    });
  }

  state.funfacts[i] = funfact;
  await state.save();

  res.json(state);
});

/* =========================================================
   DELETE FUNFACT
========================================================= */
app.delete("/states/:state/funfact", verifyState, async (req, res) => {
  const { index } = req.body;

  if (!index) {
    return res.status(400).json({
      message: "State fun fact index value required"
    });
  }

  const state = await State.findOne({ stateCode: req.code });

  if (!state || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${req.code}`
    });
  }

  const i = index - 1;

  if (i < 0 || i >= state.funfacts.length) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${req.code}`
    });
  }

  state.funfacts.splice(i, 1);
  await state.save();

  res.json(state);
});

/* =========================================================
   START SERVER
========================================================= */
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB error:", err);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (no DB fallback)`);
    });
  });


