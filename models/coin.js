const mongoose = require('mongoose');

const { Schema } = mongoose;

const coinSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  fullName: {
    type: String,
    required: false,
    unique: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model('Coin', coinSchema);
