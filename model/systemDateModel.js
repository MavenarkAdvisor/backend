const mongoose = require('mongoose');

const systemDateSchema = new mongoose.Schema({
    settlementDate:Number,
    valueDate:Number
},
{timestamps:true,
require:true})

const systemDate = mongoose.model('systemDate', systemDateSchema);

module.exports = systemDate;