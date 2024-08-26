const mongoose = require("mongoose");

const subsecinfolatestSchema = new mongoose.Schema(
  {
    SubSecCode: String,
    ValuationDate: Date,
    SystemDate: Date,
    SecCode: String,
    ISIN: String,
    SecurityName: String,
    YTM: Number,
    FaceValue: Number,
    CouponRate: Number,
    CouponType: String,
    LIPDate: Date,
    NIPDate: Date,
    RecordDate: Date,
    NIPDateForSettlement: Date,
    LIPDateForSettlement: Date,
    DCB: Number,
    IntAccPerDay: Number,
    DirtyPriceForSettlement: Number,
    IntAccPerDayForSettlement: Number,
    CleanPriceforSettlement: Number,
    Priceper100: Number,
    FaceValueForValuation: Number,
    MaturityDate: Date,
    LipDateForValuation: Date,
    DirtyPriceForValuation: Number,
    PrincipalRedemptionSinceLIP: Number,
    IntAccPerDayForValuation: Number,
    CleanPriceforValuation: Number,
    PRDPrincipal: Number,
    PRDInterest: Number,
    CleanPriceForPRDUnits: Number,
    MacaulayDuration: Number,
    ModifiedDuration: Number,
  },
  { timestamps: true, require: true }
);

const Subsecinfolatest = mongoose.model(
  "subsecinfolatest",
  subsecinfolatestSchema
);

module.exports = Subsecinfolatest;
