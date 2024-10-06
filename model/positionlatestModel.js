const mongoose = require("mongoose");

const positionlatestSchema = new mongoose.Schema({
  Date: {
    type: Date,
    required: true,
  },
  ClientCode: {
    type: Number,
    required: true,
  },
  SecurityCode: {
    type: String,
    required: true,
  },
  Qty: {
    type: Number,
    required: true,
  },
  HoldingCost: {
    type: Number,
    required: true,
  },
  HoldingValueOnToday: {
    type: Number,
    required: true,
  },
  CleanPrice: {
    type: Number,
    required: true,
  },
  HoldingValueOnPreviousDay: {
    type: Number,
  },
  CumulativeAmortisationTillToday: {
    type: Number,
    required: true,
  },
  CumulativeAmortisationTillPreviousDay: {
    type: Number,
    required: true,
  },
  AmortisationForDay: {
    type: Number,
    required: true,
  },
  CorpActionQty: {
    type: Number,
    required: true,
  },
  InterestAccruedPerUnitSinceLIPDate: {
    type: Number,
    required: true,
  },
  InterestAccruedSinceLIPDate: {
    type: Number,
    required: true,
  },
  InterestAccrualPerDayPerUnit: {
    type: Number,
    required: true,
  },
  InterestAccrualForDay: {
    type: Number,
    required: true,
  },
  PrincipalRedemptionPerUnitForDay: {
    type: Number,
    required: true,
  },
  PrincipalRedemptionForDay: {
    type: Number,
    required: true,
  },
  MarketPricePerUnitOnToday: {
    type: Number,
    required: true,
  },
  MarketValueOnToday: {
    type: Number,
    required: true,
  },
  CumulativeUnrealisedGainLossUptoToDay: {
    type: Number,
    required: true,
  },
});

const Positionlatest = mongoose.model("positionlatest", positionlatestSchema);

module.exports = Positionlatest;
