const mongoose = require("mongoose");

const stockmasterV2Schema = new mongoose.Schema({
  ClientCode: { type: Number, required: true },
  ClientName: { type: String, default: null }, // Can be null or undefined
  EventType: { type: String, required: true },
  TradeDate: { type: Date, required: true },
  SettlementDate: { type: Date, required: true },
  SecurityCode: { type: String, required: true },
  SecuritySubCode: { type: String, required: true },
  YTM: { type: Number, required: true },
  Quantity: { type: Number, required: true },
  Rate: { type: Number, required: true },
  InterestPerUnit: { type: Number, required: true },
  StampDuty: { type: Number, default: null }, // Can be null or undefined
  FaceValuePerUnit: { type: Number, required: true },
  FaceValue: { type: Number, required: true },
  Amortisation: { type: Number, required: true },
  CleanConsideration: { type: Number, required: true },
  InterestAccrued: { type: Number, required: true },
  DirtyConsideration: { type: Number, required: true },
  TransactionNRD: { type: Date },
  PRDFlag: { type: String, default: "" },
  NextDueDate: { type: Date, required: true },
  PRDHolding: { type: String, default: "" },
  UniqueCode: { type: String, required: true },
  SellBalance: { type: Number, required: true },
  BuyBalance: { type: Number, required: true },
});

const StockmasterV2 = mongoose.model("StockmasterV2", stockmasterV2Schema);

module.exports = StockmasterV2;
