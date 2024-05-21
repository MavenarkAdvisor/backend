const mongoose = require('mongoose');

const securityDetailsSchema = new mongoose.Schema({
    SecurityCode:String,
    ISIN:String,
    SecurityDescription:String,
    AssetType:String,
    IssuanceDate:Number,
    MaturityDate:Number,
    CouponRate:Number,
    CouponType:Number,
    Frequency:String,
    Maturity:String,
    Seniority:String,
    Security:String,
    IssuerShortName:String,
    IssuerFullName:String,
    Sector:String,
    Exchange:String,
    RDDays:Number,
    RDType:String,

},
{
    timestamps:true,
    require:true
})

const SecurityDetails = mongoose.model('securityDetails', securityDetailsSchema);

module.exports = SecurityDetails;