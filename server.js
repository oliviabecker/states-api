require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================================
   ROOT (must return HTML)
========================================================= */
app.get("/", (req, res) => {
  res.set("Content-Type", "text/html");
  res.send("<h1>States API is running</h1>");
});

/* =========================================================
   GET ALL STATES + contig FILTER
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
   GET SINGLE STATE
========================================================= */
app.get("/states/:state", verifyState, (req, res) => {
  const state = statesData.find((s) => s.code === req.code);
  res.json(state);
});

/* =========================================================
   HELPER: FIND STATE OBJECT
========================================================= */
const getState = (code) =>
  statesData.find((s) => s.code === code.toUpperCase());

/* =========================================================
   CAPITAL
========================================================= */
app.get("/states/:state/capital", verifyState, (req, res) => {
  const state = getState(req.code);

  res.json({
    state: state.code,
    capital: state.capital_city
  });
});

/* =========================================================
   NICKNAME
========================================================= */
app.get("/states/:state/nickname", verifyState, (req, res) => {
  const state = getState(req.code);

  res.json({
    state: state.code,
    nickname: state.nickname
  });
});

/* =========================================================
   POPULATION
========================================================= */
app.get("/states/:state/population", verifyState, (req, res) => {
  const state = getState(req.code);

  res.json({
    state: state.code,
    population: state.population.toLocaleString()
  });
});

/* =========================================================
   ADMISSION
========================================================= */
app.get("/states/:state/admission", verifyState, (req, res) => {
  const state = getState(req.code);

  res.json({
    state: state.code,
    admitted: state.admission_date
  });
});

/* =========================================================
   FUN FACT GET
========================================================= */
app.get("/states/:state/funfact", verifyState, (req, res) => {
  const state = getState(req.code);

  if (!state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${state.state}`
    });
  }

  const random =
    state.funfacts[Math.floor(Math.random() * state.funfacts.length)];

  res.json({ funfact: random });
});

//FUN FACTS

const getState = (code) =>
  statesData.find((s) => s.code === code.toUpperCase());

/* =========================================================
   POST /states/:state/funfact
========================================================= */
app.post("/states/:state/funfact", verifyState, (req, res) => {
  const state = getState(req.code);

  const { funfacts } = req.body;

  if (!funfacts) {
    return res.status(400).json({
      message: "State fun facts value required"
    });
  }

  if (!Array.isArray(funfacts)) {
    return res.status(400).json({
      message: "State fun facts value must be an array"
    });
  }

  if (!state.funfacts) {
    state.funfacts = [];
  }

  // DO NOT overwrite existing
  state.funfacts.push(...funfacts);

  res.json(state);
});

/* =========================================================
   PATCH /states/:state/funfact
========================================================= */
app.patch("/states/:state/funfact", verifyState, (req, res) => {
  const state = getState(req.code);

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

  if (!state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${state.state}`
    });
  }

  const i = index - 1;

  if (i < 0 || i >= state.funfacts.length) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${state.state}`
    });
  }

  state.funfacts[i] = funfact;

  res.json(state);
});

/* =========================================================
   DELETE /states/:state/funfact
========================================================= */
app.delete("/states/:state/funfact", verifyState, (req, res) => {
  const state = getState(req.code);

  const { index } = req.body;

  if (!index) {
    return res.status(400).json({
      message: "State fun fact index value required"
    });
  }

  if (!state.funfacts || state.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${state.state}`
    });
  }

  const i = index - 1;

  if (i < 0 || i >= state.funfacts.length) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${state.state}`
    });
  }

  state.funfacts.splice(i, 1);

  res.json(state);
});

/* =========================================================
   404 HANDLER 
========================================================= */
app.use((req, res) => {
  res.status(404).set("Content-Type", "text/html");
  res.send("<h1>404 - Not Found</h1>");
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
  .catch(() => {
  
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (no DB)`);
    });
  });


