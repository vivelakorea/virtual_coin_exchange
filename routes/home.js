/* eslint-disable no-console */

// libraries
const express = require('express');
const { body, validationResult } = require('express-validator');

// models
const User = require('../models/user');
const Coin = require('../models/coin');
const Asset = require('../models/asset');
const Key = require('../models/key');

// self made libraries
const { encryptPassword, makeToken } = require('../utils');
const { verifyToken } = require('./middelwares');

const router = express.Router();

// register
router.post('/register',
  [
    body('name').isLength({ min: 4, max: 12 }),
    body('name').isAlphanumeric(),
    body('email').isEmail(),
    body('email').isLength({ max: 99 }),
    body('password').isLength({ min: 8, max: 16 }),
  // eslint-disable-next-line consistent-return
  ], async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const error = new Error();
        error.message = '';
        errors.array().forEach((e) => {
          error.message += `${e.param}: ${e.msg}, `;
        });
        error.message = error.message.slice(0, -2);

        error.status = 400;
        return next(error);
      }
      const { name, email, password } = req.body;
      if (await User.findOne({ email })) {
        const error = new Error('Already registered');
        error.status = 400;
        return next(error);
      }
      const encryptedPassword = encryptPassword(password);
      const user = new User({ name, email, password: encryptedPassword });
      await user.save();
      const coin = await Coin.findOne({ code: 'usd' });
      const asset = new Asset({ user, coin, quantity: 100000 });
      await asset.save();
      res.status(200);
      return res.send({});
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

// login
// eslint-disable-next-line consistent-return
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error('가입되지 않은 메일입니다');
      error.status = 404;
      return next(error);
    }

    if (user.password !== encryptPassword(password)) {
      const error = new Error('틀린 비밀번호입니다');
      error.status = 404;
      return next(error);
    }

    // 같은 메일주소로 다시 로그인한 경우 이전 토큰 삭제
    if (await Key.findOne({ user })) await Key.findOneAndDelete({ user });

    const userObj = JSON.parse(JSON.stringify(user));
    const token = makeToken(userObj);
    const key = new Key({ user, token, createdAt: new Date() });
    await key.save();
    res.send({ key: token });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// assets
router.get('/assets', verifyToken, async (req, res, next) => {
  try {
    // 결과 담을 객체 quantities
    const quantities = {};

    // 유저 에셋 전부 찾아오기
    const { decoded: { _id: userId } } = req;
    const assets = await Asset.find({ user: userId });

    // 유저가 갖고 있는 코인들 이름 배열 만들기
    // e.g) coinIds === ['123bc12d...', '12d....a', 'a1232...], coinCodes === ['btc', 'xrp', 'usd']
    const coinIds = assets.map((e) => e.coin);
    const coinCodes = [];
    for (let i = 0; i < coinIds.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const coin = await Coin.findOne({ _id: coinIds[i] });
      const coinCode = coin.code;
      coinCodes.push(coinCode);
    }
    // quantities에 코인 코드:수량 담기
    for (let i = 0; i < coinCodes.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const asset = await Asset.findOne({ user: userId, coin: coinIds[i] });
      const { quantity } = asset;
      quantities[String(coinCodes[i])] = Number(Number(quantity).toFixed(4));
    }
    res.send(quantities);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
