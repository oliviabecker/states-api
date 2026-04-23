const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true,
  },
  funfacts: {
    type: [String],
    default: [],
  },
});

module.exports = mongoose.model("State", StateSchema);
