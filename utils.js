/* eslint-disable no-console */
const crypto = require('crypto');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// password 암호화
const encryptPassword = (password) => crypto.createHash('sha512').update(password).digest('base64');

// jwt 토큰 생성
const makeToken = (user) => jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });

// coin의 코드를 받아서 해당 coin의 현재 가격 받아옴
const getPrice = async (code, fullName) => {
  try {
    if (code === 'usd') return 1;
    let name;
    if (!fullName) {
      switch (code) {
        case 'btc':
          name = 'bitcoin';
          break;
        case 'xrp':
          name = 'ripple';
          break;
        case 'bch':
          name = 'bitcoin-cash';
          break;
        case 'eth':
          name = 'ethereum';
          break;
        case 'usdt':
          name = 'tether';
          break;
        case 'link':
          name = 'chainlink';
          break;
        default:
          name = null;
      }
    } else name = fullName;
    const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=usd`);
    const price = response.data[name].usd;
    return price;
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = { encryptPassword, makeToken, getPrice };
