const mongoose = require("mongoose");

const trialBalSchema = new mongoose.Schema({
  LedgerCode: {
    type: String,
  },

  ClientCode: {
    type: Number,
  },

  Date: {
    type: Date,
  },

  Amount: {
    type: Number,
  },

  LedgerName: {
    type: String,
  },
});

module.exports = mongoose.model("trialbalance", trialBalSchema);
