const mongoose = require('mongoose');

const cashflowSchema = new mongoose.Schema({
    SubSecCode:String,
    Date: Number,
    Interest: String,
    Principal:String,
    Total:String,
    DCB:Number,
    RDDays:Number,
    RDType:String,
},
{timestamps:true,
require:true})

const Cashflow = mongoose.model('cashflow', cashflowSchema);

module.exports = Cashflow;
