/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connect = () => {
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', true);
  }
  mongoose.connect(`mongodb+srv://ghostman:${process.env.MONGO_PASSWORD}@cluster0.xa9an.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (error) => {
      if (error) {
        console.log('mongodb connection error: ', error);
      } else {
        console.log('mongodb connection success');
      }
    });
};

mongoose.connection.on('error', (error) => {
  console.error('mongodb connection error', error);
});

mongoose.connection.on('disconnected', () => {
  console.error('mongodb disconnected. reconnecting... ');
  connect();
});

module.exports = connect;
