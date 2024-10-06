const mongoose = require("mongoose");

const marketpriceSchema = new mongoose.Schema({
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
  RatingValue: { type: Number, },
  YTM: { type: Number, required: true },
});

const MarketPrice = mongoose.model("marketprice", marketpriceSchema);

module.exports = MarketPrice;
