const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  EventType: {
    type: String,
  },
  LedgerCode: {
    type: String,
  },
  ClientCode: {
    type: Number,
  },
  Date: {
    type: Date,
  },
  SecurityCode: {
    type: String,
  },
  Amount: {
    type: Number,
  },
  LedgerName: {
    type: String,
  },
  CrDr: {
    type: String,
  },
  Narration: {
    type: String,
  },
});

module.exports = mongoose.model("ledger", ledgerSchema);
