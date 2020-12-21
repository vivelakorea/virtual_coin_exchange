const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const keySchema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  publicKey: {
    type: String,
    required: true,
  },
  secretKey: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model('Key', keySchema);
