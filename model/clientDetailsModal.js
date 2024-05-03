const mongoose = require('mongoose');

const clientDetailsSchema = new mongoose.Schema({
    ClientCode:String,
    PAN:String,
    ClientName:String,
    AddressLine1:String,
    AddressLine2:String,
    AddressLine3:String,
    City:String,
    State:String,
    PinCode:String,
    ClientDPName:String,
    ClientDPID:String,
    ClientDematID:String,
    BankName:String,
    BankAccountNo:String,
    IFSC:String,
    BranchName:String,
    UCC:String,
},
{timestamps:true,
require:true})

const clientDetails = mongoose.model('clientDetails', clientDetailsSchema);

module.exports = clientDetails;