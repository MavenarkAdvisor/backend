const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  ClientCode: {
    type: Number,
    required: true,
  },
  ClientName: {
    type: String,
  },
  EventType: {
    type: String,
    required: true,
  },
  TradeDate: {
    type: Number,
    required: true,
  },
  SettlementDate: {
    type: Number,
    required: true,
  },
  SecurityCode: {
    type: String,
    required: true,
  },
  Quantity: {
    type: Number,
    required: true,
  },
  Rate: {
    type: Number,
    required: true,
  },
  InterestPerUnit: {
    type: Number,
    required: true,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
