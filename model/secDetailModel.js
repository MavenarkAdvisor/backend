const mongoose = require('mongoose');

const secDetailSchema = new mongoose.Schema({
    secCode:String,
    ISIN:String,
    secName:String,
    SecurityDescription:String,
    AllotmentDate:Number,
    MaturityDate:Number,
    CallDate:Number,
    PutDate:Number,
    CouponRate:Number,
    FrequencyValue:Number,
    FrequencyName:String,
    FaceValue:Number,
    CouponType:String,
    RecordDateDays:Number,
    RecordDateType:String,
    PrimaryYTM:Number,
},
{timestamps:true,
require:true})

const secDetail = mongoose.model('secDetail', secDetailSchema);

module.exports = secDetail;




