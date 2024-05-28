const mongoose = require('mongoose');

const systemDateSchema = new mongoose.Schema({
    settlementDate:Number
},
{timestamps:true,
require:true})

const systemDate = mongoose.model('systemDate', systemDateSchema);

module.exports = systemDate;