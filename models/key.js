const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const keySchema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: false,
  },
});

module.exports = mongoose.model('Key', keySchema);
