const mongoose = require("mongoose");

const trialBalSchema = new mongoose.Schema({

    ClientCode: {
        type: Number,
    },
    LedgerCode: {
        type: String,
    },
    Date: {
        type: Date,
    },
    LedgerName: {
        type: String,
    },
    Amount: {
        type: Number,
    },
});

module.exports = mongoose.model("trialBal", trialBalSchema);
