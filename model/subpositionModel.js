const mongoose = require("mongoose");

const subpositionSchema = new mongoose.Schema({
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
  AverageCostPerUnit: {
    type: Number,
    required: true,
  },
  CumulativeAmortisation_Today: {
    type: Number,
    required: true,
  },
  CleanPrice_PreviousDay: {
    type: Number,
  },
  HoldingValue_PreviousDay: {
    type: Number,
  },
  CumulativeAmortisation_PreviousDay: {
    type: Number,
    required: true,
  },
  AmortisationForDay: {
    type: Number,
  },
});

const SubPosition = mongoose.model("subposition", subpositionSchema);

module.exports = SubPosition;
