/* eslint-disable no-console */
const dotenv = require('dotenv');
const Coin = require('./models/coin');

dotenv.config();

// eslint-disable-next-line consistent-return
const registerCoin = async (code, fullName) => {
  try {
    if (!await Coin.findOne({ code })) {
      await Coin.create({ code, fullName });
      return await Coin.findOne({ code, fullName });
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${code} (${fullName}) is already saved in db`);
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = registerCoin;
