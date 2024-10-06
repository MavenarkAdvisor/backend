const mongoose = require("mongoose");

const ledgercodeSchema = new mongoose.Schema({
  LedgerCode: {
    type: String,
    required: true,
  },
  LedgerName: {
    type: String,
    required: true,
  },
  SebiName: {
    type: String,
    required: true,
  },
  FinancialStatementName: {
    type: String,
    required: true,
  },
  Type: {
    type: String,
    required: true,
  },
});

const LedgerCode = mongoose.model("ledgercode", ledgercodeSchema);
module.exports = LedgerCode;
