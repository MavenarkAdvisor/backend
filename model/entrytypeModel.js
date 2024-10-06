const mongoose = require("mongoose");

const entrytypeSchema = new mongoose.Schema({
  EntryType: {
    type: String,
    required: true,
  },
  Meaning: {
    type: String,
    required: true,
  },
  DefaultNarration: {
    type: String,
    required: true,
  },
});

const EntryType = mongoose.model("entrytype", entrytypeSchema);
module.exports = EntryType;
