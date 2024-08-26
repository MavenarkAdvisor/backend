const mongoose = require("mongoose");

const secDetailSchema = new mongoose.Schema(
  {
    SecurityCode: String,
    ISIN: String,
    SecurityDescription: String,
    AssetType: String,
    IssuanceDate: Number,
    MaturityDate: Number,
    CouponRate: Number,
    CouponType: String,
    Frequency: String,
    Maturity: String,
    Seniority: String,
    Security: String,
    IssuerShortName: String,
    IssuerFullName: String,
    Sector: String,
    Exchange: String,
    RDDays: Number,
    RDType: String,
    ListingStatus: String,
  },
  { timestamps: true, require: true }
);

const secDetail = mongoose.model("secDetail", secDetailSchema);

module.exports = secDetail;
