const mongoose = require("mongoose");

const redemptionlatestSchema = new mongoose.Schema(
  {
    SubSecCode: String,
    SecCode: String,
    ISIN: String,
    Date: Number,
    Interest: Number,
    Principal: Number,
    Total: Number,
    DCB: Number,
    YTM: Number,
    StartDateForValue: Date,
    DFForValuation: Number,
    PVForValuation: Number,
    Weightage: String,
    Tenor: Number,
    MacaulayDuration: Number,
    RDDays: Number,
    RDType: String,
    RecordDate: Date,
    StartDate: Date,
    DF: Number,
    PV: Number,
  },
  { timestamps: true, require: true }
);

const Redemptiomlatest = mongoose.model(
  "redemptionlatest",
  redemptionlatestSchema
);

module.exports = Redemptiomlatest;
