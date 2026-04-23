console.log("SERVER STARTING...");
console.log("PORT:", process.env.PORT);
console.log("DB:", process.env.DATABASE_URI ? "FOUND" : "MISSING");
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const statesData = require("./statesData.json");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("States API is running");
});

const verifyState = (req, res, next) => {
  const stateCodes = statesData.map((s) => s.code);

  const stateCode = req.params.state.toUpperCase();

  if (!stateCodes.includes(stateCode)) {
    return res.status(400).json({ error: "Invalid state code" });
  }

  req.code = stateCode;
  next();
};


app.get("/states/:state", verifyState, (req, res) => {
  const stateData = statesData.find((s) => s.code === req.code);
  res.json(stateData);
});


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
