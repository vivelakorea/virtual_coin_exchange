const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;

const assetSchema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  coin: {
    type: ObjectId,
    required: true,
    ref: 'Coin',
  },
  quantity: {
    type: Number,
    required: true,
  },

});

module.exports = mongoose.model('Asset', assetSchema);
