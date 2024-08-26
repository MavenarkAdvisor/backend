const mongoose = require("mongoose");

const cashflowSchema = new mongoose.Schema(
  {
    SecurityCode: String,
    ISIN: String,
    Date: Number,
    Interest: Number,
    Principal: Number,
    Total: Number,
    CouponRate: Number,
    DCB: Number,
  },
  { timestamps: true, require: true }
);

const Cashflow = mongoose.model("cashflow", cashflowSchema);

module.exports = Cashflow;
