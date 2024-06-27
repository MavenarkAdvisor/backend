const mongoose = require("mongoose");

const systemDateSchema = new mongoose.Schema(
  {
    SystemDate: Date,
    ValuationDate: Date,
  },
  { timestamps: true, require: true }
);

const systemDate = mongoose.model("systemDate", systemDateSchema);

module.exports = systemDate;
