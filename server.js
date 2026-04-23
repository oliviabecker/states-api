require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");
const State = require("./models/States");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   CONNECT MONGO
========================= */
mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err));

/* =========================
   ROOT (HTML REQUIRED)
========================= */
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <h1>States API</h1>
    <p>API is running</p>
  `);
});

/* =========================
   HELPERS
========================= */
const getStateData = (code) =>
  statesData.find((s) => s.code === code.toUpperCase());

const isValidState = (code) =>
  statesData.some((s) => s.code === code.toUpperCase());

const formatStateResponse = async (stateObj) => {
  const dbState = await State.findOne({
    stateCode: stateObj.code,
  });

  const funfacts = dbState?.funfacts;

  return {
    ...stateObj,
    ...(funfacts?.length ? { funfacts } : {}),
  };
};

/* =========================
   404 HANDLER (HTML)
========================= */
app.use((req, res) => {
  res.status(404).send(`
    <h1>404</h1>
    <p>Resource not found</p>
  `);
});

/* =========================
   GET ALL STATES
   /states?contig=true|false
========================= */
app.get("/states", async (req, res) => {
  let data = [...statesData];

  const { contig } = req.query;

  if (contig === "true") {
    data = data.filter((s) => s.code !== "AK" && s.code !== "HI");
  }

  if (contig === "false") {
    data = data.filter((s) => s.code === "AK" || s.code === "HI");
  }

  const results = await Promise.all(
    data.map(async (s) => {
      const dbState = await State.findOne({ stateCode: s.code });

      return {
        ...s,
        ...(dbState?.funfacts?.length
          ? { funfacts: dbState.funfacts }
          : {}),
      };
    })
  );

  res.json(results);
});

/* =========================
   STATE PARAM MIDDLEWARE
========================= */
const validateState = (req, res, next) => {
  const code = req.params.state.toUpperCase();

  if (!isValidState(code)) {
    return res
      .status(400)
      .json({ message: "Invalid state abbreviation parameter" });
  }

  req.code = code;
  next();
};

/* =========================
   GET STATE
========================= */
app.get("/states/:state", validateState, async (req, res) => {
  const state = getStateData(req.code);
  const formatted = await formatStateResponse(state);
  res.json(formatted);
});

/* =========================
   FUN FACTS GET
========================= */
app.get("/states/:state/funfact", validateState, async (req, res) => {
  const dbState = await State.findOne({ stateCode: req.code });

  if (!dbState || dbState.funfacts.length === 0) {
    const stateName = getStateData(req.code).state;
    return res
      .status(404)
      .json({ message: `No Fun Facts found for ${stateName}` });
  }

  const random =
    dbState.funfacts[
      Math.floor(Math.random() * dbState.funfacts.length)
    ];

  res.json({ funfact: random });
});

/* =========================
   POST FUN FACTS
========================= */
app.post("/states/:state/funfact", validateState, async (req, res) => {
  const { funfacts } = req.body;

  if (!funfacts) {
    return res
      .status(400)
      .json({ message: "State fun facts value required" });
  }

  if (!Array.isArray(funfacts)) {
    return res
      .status(400)
      .json({ message: "State fun facts value must be an array" });
  }

  const updated = await State.findOneAndUpdate(
    { stateCode: req.code },
    { $push: { funfacts: { $each: funfacts } } },
    { upsert: true, new: true }
  );

  res.json(updated);
});

/* =========================
   PATCH FUN FACT
========================= */
app.patch("/states/:state/funfact", validateState, async (req, res) => {
  const { index, funfact } = req.body;

  const dbState = await State.findOne({ stateCode: req.code });

  if (!dbState || dbState.funfacts.length === 0) {
    return res
      .status(404)
      .json({ message: `No Fun Facts found for ${getStateData(req.code).state}` });
  }

  if (!index) {
    return res
      .status(400)
      .json({ message: "State fun fact index value required" });
  }

  if (!funfact || typeof funfact !== "string") {
    return res
      .status(400)
      .json({ message: "State fun fact value required" });
  }

  const i = index - 1;

  if (!dbState.funfacts[i]) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${getStateData(req.code).state}`,
    });
  }

  dbState.funfacts[i] = funfact;
  await dbState.save();

  res.json(dbState);
});

/* =========================
   DELETE FUN FACT
========================= */
app.delete("/states/:state/funfact", validateState, async (req, res) => {
  const { index } = req.body;

  const dbState = await State.findOne({ stateCode: req.code });

  if (!dbState || dbState.funfacts.length === 0) {
    return res.status(404).json({
      message: `No Fun Facts found for ${getStateData(req.code).state}`,
    });
  }

  if (!index) {
    return res
      .status(400)
      .json({ message: "State fun fact index value required" });
  }

  const i = index - 1;

  if (!dbState.funfacts[i]) {
    return res.status(404).json({
      message: `No Fun Fact found at that index for ${getStateData(req.code).state}`,
    });
  }

  dbState.funfacts.splice(i, 1);
  await dbState.save();

  res.json(dbState);
});

/* =========================
   CAPITAL
========================= */
app.get("/states/:state/capital", validateState, (req, res) => {
  const state = getStateData(req.code);
  res.json({ state: state.state, capital: state.capital });
});

/* =========================
   NICKNAME
========================= */
app.get("/states/:state/nickname", validateState, (req, res) => {
  const state = getStateData(req.code);
  res.json({ state: state.state, nickname: state.nickname });
});

/* =========================
   POPULATION
========================= */
app.get("/states/:state/population", validateState, (req, res) => {
  const state = getStateData(req.code);
  res.json({
    state: state.state,
    population: Number(state.population).toLocaleString(),
  });
});

/* =========================
   ADMISSION
========================= */
app.get("/states/:state/admission", validateState, (req, res) => {
  const state = getStateData(req.code);
  res.json({ state: state.state, admitted: state.admission });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
