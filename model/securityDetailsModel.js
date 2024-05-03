const mongoose = require('mongoose');

const securityDetailsSchema = new mongoose.Schema({
    ISIN:String,
    IssuerFullName:String,
    SecurityDescription:String,
    AllotmentDate:Number,
    MaturityDate:Number,
    CouponRate:String,
    FrequencyValue:String,
    FaceValue:String,
    InterestType:String,
    RecordDateDays:Number,
    RecordDateType:String,
    PrimaryYTM:String
},
{
    timestamps:true,
    require:true
})

const SecurityDetails = mongoose.model('securityDetails', securityDetailsSchema);

module.exports = SecurityDetails;