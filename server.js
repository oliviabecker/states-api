require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");

const app = express();

app.use(cors());
app.use(express.json());

/* 
   HTML
*/
app.get("/", (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>States API</title>
      </head>
      <body>
        <h1>States API is running</h1>
      </body>
    </html>
  `);
});

/*
   FUN FACTS
*/
const funFactsStore = {
  KS: [
    "Kansas experiences more tornadoes than most other states each year.",
    "The first ever Pizza Hut restaurant was opened in Wichita, Kansas.",
    "Kansas is one of the top producers of wheat in the United States."
  ],
  MO: [
    "Missouri is home to the Gateway Arch, which symbolizes westward expansion.",
    "Mark Twain, a famous American author, was born in Missouri.",
    "Missouri has thousands of caves and is often called the Cave State."
  ],
  OK: [
    "Oklahoma has one of the largest Native American populations in the U.S.",
    "The state has a diverse landscape including plains, forests, and mountains.",
    "Oklahoma City experienced one of the largest land runs in U.S. history."
  ],
  NE: [
    "Nebraska has a single-house (unicameral) state legislature.",
    "The state is a major producer of corn and beef.",
    "Chimney Rock is one of Nebraska’s most famous natural landmarks."
  ],
  CO: [
    "Colorado is home to many high peaks, including over 50 mountains above 14,000 feet.",
    "The state is known for its outdoor recreation like skiing and hiking.",
    "Denver, Colorado’s capital, is nicknamed the Mile High City."
  ]
};

/* 
   HELPER
 */
const findState = (code) =>
  statesData.find((s) => s.code === code.toUpperCase());

/*
   VERIFY STATE
 */
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

/* 
   GET ALL STATES
 */
app.get("/states", (req, res) => {
  let states = [...statesData];

  if (req.query.contig === "true") {
    states = states.filter((s) => s.code !== "AK" && s.code !== "HI");
  }

  if (req.query.contig === "false") {
    states = states.filter((s) => s.code === "AK" || s.code === "HI");
  }

 
  states = states.map((state) => {
    const facts = funFactsStore[state.code];
    if (facts && facts.length > 0) {
      return { ...state, funfacts: facts };
    }
    return state;
  });

  res.json(states);
});

/* 
   GET STATE
*/
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

/* 
   GET FUN FACT
 */
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

/*
   POST FUN FACT
 */
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

  app.post("/states/:state/funfact", verifyState, (req, res) => {

/*
   PATCH FUN FACT
 */
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

/* 
   DELETE FUN FACT
 */
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

/* 
   CAPITAL
 */
app.get("/states/:state/capital", verifyState, (req, res) => {
  res.json({
    state: req.stateData.state,
    capital: req.stateData.capital_city,
  });
});

/* 
   NICKNAME
 */
app.get("/states/:state/nickname", verifyState, (req, res) => {
  res.json({
    state: req.stateData.state,
    nickname: req.stateData.nickname,
  });
});

/* 
   POPULATION STRING
 */
app.get("/states/:state/population", verifyState, (req, res) => {
  const formatted = req.stateData.population.toLocaleString("en-US");

  res.json({
    state: req.stateData.state,
    population: formatted,
  });
});

/* 
   ADMISSION DATE
*/
app.get("/states/:state/admission", verifyState, (req, res) => {
  res.json({
    state: req.stateData.state,
    admitted: req.stateData.admission_date,
  });
});

/* 
   404 HTML
 */
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 Not Found</title>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
      </body>
    </html>
  `);
});

/*
   START SERVER
 */
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

