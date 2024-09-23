const mongoose = require("mongoose");

const stockmasterV3Schema = new mongoose.Schema({
  ClientCode: { type: Number, required: true },
  ClientName: {
    type: String,
  },
  SecurityCode: { type: String, required: true },
  SecuritySubCode: { type: String, required: true },
  SalePrice: { type: Number, required: true },
  SaleDate: { type: Date, required: true },
  SaleUniqueCode: { type: String, required: true },
  Sell: { type: Number, required: true },
  Quantity: { type: Number, required: true },
  saleQty: { type: Number, required: true },
  purchaseQty: { type: Number, required: true },
  Holdingperiod: { type: Number, required: true },
  Purchaseprice: { type: Number, required: true },
  PurchaseValue: { type: Number, required: true },
  SaleValue: { type: Number, required: true },
  CapitalGainLoss: { type: Number, required: true },
  ListingStatus: { type: String },
  CapitalGainType: {
    type: String,
    required: true,
  },
  ISIN: { type: String, required: true },
  PurchaseDate: { type: Date, required: true },
  PurchaseUniqueCode: { type: String, required: true },
  PurchaseSubSecCode: { type: String, required: true },
  OriginalPurchasePrice: { type: Number, required: true },
  OriginalPurchaseValue: { type: Number, required: true },
  PRDHoldingFlag: { type: String },
});

const StockmasterV3 = mongoose.model("StockmasterV3", stockmasterV3Schema);

module.exports = StockmasterV3;
