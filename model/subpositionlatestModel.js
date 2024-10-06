const mongoose = require("mongoose");

const subpositionlatestSchema = new mongoose.Schema({
  ClientCode: {
    type: Number,
    required: true,
  },
  Date: {
    type: Date,
    required: true,
  },
  SecuritySubCode: {
    type: String,
    required: true,
  },
  SecurityCode: {
    type: String,
    required: true,
  },
  SubSecCodeQty: {
    type: Number,
    required: true,
  },
  CleanPrice_Today: {
    type: Number,
    required: true,
  },
  HoldingValue_Today: {
    type: Number,
    required: true,
  },
  HoldingCost: {
    type: Number,
    required: true,
  },
  CumulativeAmortisation_Today: {
    type: Number,
    required: true,
  },
  CleanPrice_PreviousDay: {
    type: String,
  },
  HoldingValue_PreviousDay: {
    type: String,
  },
  CumulativeAmortisation_PreviousDay: {
    type: Number,
    required: true,
  },
  AmortisationForDay: {
    type: Number,
  },
});

const SubPositionlatest = mongoose.model(
  "subpositionlatest",
  subpositionlatestSchema
);

module.exports = SubPositionlatest;
