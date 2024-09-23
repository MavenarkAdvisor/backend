const mongoose = require("mongoose");

const ratingmasterSchema = new mongoose.Schema({
  Rating: { type: String, required: true },
  Value: { type: Number },
});

const Ratingmaster = mongoose.model("ratingmaster", ratingmasterSchema);

module.exports = Ratingmaster;
