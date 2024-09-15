const mongoose = require("mongoose");

const marketpricelatestSchema = new mongoose.Schema({
  SecurityCode: { type: String, required: true },
  ISIN: { type: String, required: true },
  Date: { type: Date, required: true },
  DirtyPricePer100: { type: Number, required: true },
  InterestPer100: { type: Number, required: true },
  CleanPricePer100: { type: Number, required: true },
  CreditRating: { type: String, required: true },
  FaceValue: { type: Number, required: true },
  DirtyPrice: { type: Number, required: true },
  Interest: { type: Number, required: true },
  CleanPrice: { type: Number, required: true },
  Rating: { type: String, required: true },
  RatingValue: { type: Number, required: true },
  YTM: { type: Number, required: true },
});

const MarketPricelatest = mongoose.model(
  "marketpricelatest",
  marketpricelatestSchema
);

module.exports = MarketPricelatest;
