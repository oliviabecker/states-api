require("dotenv").config();
const mongoose = require("mongoose");
const State = require("./models/States");

mongoose.connect(process.env.DATABASE_URI);

const seedStates = async () => {
  await State.deleteMany();

  await State.insertMany([
    {
      stateCode: "KS",
      funfacts: ["Wheat capital", "Tornado alley", "Geographic center of US nearby"]
    },
    {
      stateCode: "MO",
      funfacts: ["Gateway Arch", "Caves state", "Barbecue culture"]
    },
    {
      stateCode: "OK",
      funfacts: ["Oil production", "Native American history", "Tornadoes"]
    },
    {
      stateCode: "NE",
      funfacts: ["Cornhusker state", "Sandhills region", "Omaha zoo"]
    },
    {
      stateCode: "CO",
      funfacts: ["Rocky Mountains", "Highest average elevation", "300+ days of sun"]
    }
  ]);

  console.log("Seeded!");
  mongoose.connection.close();
};

seedStates();