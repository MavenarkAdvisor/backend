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
    // RDDays:Number,
    // RDType:String,
    // YTM:Number,
    // StartDate:Number,
    // DF:Number,
    // PV:Number,//pv for valuation
    // Weightage:Number,
    // Tenor:Number,
    // MacaulaysDuration:Number,
    // RecordDate:Number
  },
  { timestamps: true, require: true }
);

const Cashflow = mongoose.model("cashflow", cashflowSchema);

module.exports = Cashflow;
