/* eslint-disable no-console */
const express = require('express');
const Coin = require('../models/coin');
const Asset = require('../models/asset');
const { verifyToken } = require('./middelwares');
const { getPrice } = require('../utils');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const coins = await Coin.find({});
    const codes = [];
    for (let i = 0; i < coins.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      // const price = await getPrice(String(coins[i].code));
      // if (coins[i].code !== 'usd') codes[String(coins[i].code)] = price;
      codes.push(coins[i].code);
    }

    res.send(codes);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// buy
// eslint-disable-next-line consistent-return
router.post('/:coin_name/buy', verifyToken, async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { body: { quantity }, params: { coin_name: coinCode }, userId } = req;
    quantity = Number(Number(quantity).toFixed(4));
    coinCode = coinCode.toLowerCase();

    // 해당 coin id 찾기
    const coin = await Coin.findOne({ code: coinCode });
    if (!coin) { // 없는 코인을 산다고 하면 에러
      const error = new Error('잘못된 코인 코드이거나 아직 등록되지 않은 코인입입니다');
      error.status = 400;
      return next(error);
    }
    // eslint-disable-next-line no-underscore-dangle
    const coinId = coin._id;

    // usd id 찾기
    const usd = await Coin.findOne({ code: 'usd' });
    // eslint-disable-next-line no-underscore-dangle
    const usdId = usd._id;

    // usd 얼마있는지 찾기
    const usdAsset = await Asset.findOne({ user: userId, coin: usdId });
    let usdQuantity = usdAsset.quantity;

    // coin 가격 받아오기
    const price = await getPrice(coinCode, coin.fullName);

    // 돈 부족하면 에러
    if (usdQuantity < price * Number(quantity)) {
      const error = new Error('잔액이 부족합니다');
      error.status = 400;
      return next(error);
    }

    // 돈 있으면 usd 깎음
    usdQuantity -= price * Number(quantity);
    await Asset.findOneAndUpdate({ user: userId, coin: usdId }, { quantity: usdQuantity });

    // 일단 해당 에셋 도큐멘트 있는지 확인하고 없으면 만들고 디비에 저장
    if (!await Asset.findOne({ user: userId, coin: coinId })) {
      const coinAsset = new Asset({ user: userId, coin: coinId, quantity });
      await coinAsset.save();
    } else {
      // 해당 에셋 도큐멘트 있으면 일단 이 코인 얼마 있는지 받아와야함
      const coinAsset = await Asset.findOne({ user: userId, coin: coinId });
      let coinQuantity = coinAsset.quantity;
      coinQuantity += Number(quantity);
      await Asset.findOneAndUpdate({ user: userId, coin: coinId }, { quantity: coinQuantity });
    }
    res.send({ price, quantity: Number(quantity) });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// all in!
// eslint-disable-next-line consistent-return
router.post('/:coin_name/buy_all', verifyToken, async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { params: { coin_name: coinCode }, userId } = req;
    coinCode = coinCode.toLowerCase();

    // 해당 coin id 찾기
    const coin = await Coin.findOne({ code: coinCode });
    if (!coin) { // 없는 코인을 산다고 하면 에러
      const error = new Error('잘못된 코인 코드이거나 아직 등록되지 않은 코인입입니다');
      error.status = 400;
      return next(error);
    }
    // eslint-disable-next-line no-underscore-dangle
    const coinId = coin._id;

    // usd id 찾기
    const usd = await Coin.findOne({ code: 'usd' });
    // eslint-disable-next-line no-underscore-dangle
    const usdId = usd._id;

    // usd 얼마있는지 찾기
    const usdAsset = await Asset.findOne({ user: userId, coin: usdId });
    let usdQuantity = usdAsset.quantity;

    // coin 가격 받아오기
    const price = await getPrice(coinCode, coin.fullName);

    // usdQuantity 계산
    const quantity = Math.floor((Number(usdQuantity) / Number(price)) * 10000) / 10000;
    if (quantity === 0) {
      const error = new Error('이 코인을 0.0001만큼도 살 수 없습니다');
      error.status = 404;
      return next(error);
    }
    usdQuantity -= quantity * Number(price);

    // 에셋 업데이트
    await Asset.findOneAndUpdate({ user: userId, coin: usdId }, { quantity: usdQuantity });
    // 일단 해당 에셋 도큐멘트 있는지 확인하고 없으면 만들고 디비에 저장
    if (!await Asset.findOne({ user: userId, coin: coinId })) {
      const coinAsset = new Asset({ user: userId, coin: coinId, quantity });
      await coinAsset.save();
    } else {
      // 해당 에셋 도큐멘트 있으면 일단 이 코인 얼마 있는지 받아와야함
      const coinAsset = await Asset.findOne({ user: userId, coin: coinId });
      let coinQuantity = coinAsset.quantity;
      coinQuantity += quantity;
      await Asset.findOneAndUpdate({ user: userId, coin: coinId }, { quantity: coinQuantity });
    }
    res.send({ price, quantity });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// sell
// eslint-disable-next-line consistent-return
router.post('/:coin_name/sell', verifyToken, async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { body: { quantity }, params: { coin_name: coinCode }, userId } = req;
    quantity = Number(Number(quantity).toFixed(4));
    coinCode = coinCode.toLowerCase();

    // 해당 coin id 찾기
    const coin = await Coin.findOne({ code: coinCode });
    if (!coin) { // 없는 코인을 판다고 하면 에러
      const error = new Error('잘못된 코인 코드이거나 아직 등록되지 않은 코인입입니다');
      error.status = 400;
      return next(error);
    }
    // eslint-disable-next-line no-underscore-dangle
    const coinId = coin._id;

    // usd id 찾기
    const usd = await Coin.findOne({ code: 'usd' });
    // eslint-disable-next-line no-underscore-dangle
    const usdId = usd._id;

    // usd 얼마있는지 찾기
    const usdAsset = await Asset.findOne({ user: userId, coin: usdId });
    let usdQuantity = usdAsset.quantity;

    // coin 찾기
    const coinAsset = await Asset.findOne({ user: userId, coin: coinId });
    if (!coinAsset) { // 유저가 해당 코인을 가지고 있지 않으면 에러
      const error = new Error('당신은 그 코인을 갖고 있지 않습니다');
      error.status = 400;
      return next(error);
    }
    let coinQuantity = coinAsset.quantity;
    coinQuantity = Number(Number(coinQuantity).toFixed(4));

    // coin 가격 받아오기
    const price = await getPrice(coinCode, coin.coinName);

    // coin 팔고싶은만큼 없으면 에러
    if (coinQuantity < quantity) {
      const error = new Error(`당신은 ${coinCode}를 ${coinQuantity}만큼밖에 가지고 있지 않습니다`);
      error.status = 400;
      return next(error);
    }

    // usd 늘리고 coin양 줄임
    usdQuantity += Number(price) * Number(quantity);
    coinQuantity -= Number(quantity);

    // 에셋 디비 업데이트
    await Asset.findOneAndUpdate({ user: userId, coin: usdId }, { quantity: usdQuantity });

    if (coinQuantity === 0) { // 다팔았으면 해당 도큐먼트 삭제
      await Asset.findOneAndDelete({ user: userId, coin: coinId });
    } else { // 남아있으면 해당 도큐먼트 수정
      await Asset.findOneAndUpdate({ user: userId, coin: coinId }, { quantity: coinQuantity });
    }

    res.send({ price, quantity: Number(quantity) });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// sell all of it!
// eslint-disable-next-line consistent-return
router.post('/:coin_name/sell_all', verifyToken, async (req, res, next) => {
  try {
    // eslint-disable-next-line prefer-const
    let { params: { coin_name: coinCode }, userId } = req;
    coinCode = coinCode.toLowerCase();

    // 해당 coin id 찾기
    const coin = await Coin.findOne({ code: coinCode });
    if (!coin) { // 없는 코인을 판다고 하면 에러
      const error = new Error('잘못된 코인 코드이거나 아직 등록되지 않은 코인입입니다');
      error.status = 400;
      return next(error);
    }
    // eslint-disable-next-line no-underscore-dangle
    const coinId = coin._id;

    // usd id 찾기
    const usd = await Coin.findOne({ code: 'usd' });
    // eslint-disable-next-line no-underscore-dangle
    const usdId = usd._id;

    // usd 얼마있는지 찾기
    const usdAsset = await Asset.findOne({ user: userId, coin: usdId });
    let usdQuantity = usdAsset.quantity;

    // coin 찾기
    const coinAsset = await Asset.findOne({ user: userId, coin: coinId });
    if (!coinAsset) { // 유저가 해당 코인을 가지고 있지 않으면 에러
      const error = new Error('당신은 그 코인을 갖고 있지 않습니다');
      error.status = 400;
      return next(error);
    }
    let coinQuantity = coinAsset.quantity;
    coinQuantity = Number(Number(coinQuantity).toFixed(4));

    // coin 가격 받아오기
    const price = await getPrice(coinCode, coin.coinName);

    // usdQuantity, coinQuantity 계산
    usdQuantity += Number(coinQuantity) * Number(price);
    // coinQuantity = 0;

    // 에셋 디비 업데이트
    await Asset.findOneAndUpdate({ user: userId, coin: usdId }, { quantity: usdQuantity });

    await Asset.findOneAndDelete({ user: userId, coin: coinId });

    res.send({ price, quantity: coinQuantity });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// get price
// eslint-disable-next-line consistent-return
router.get('/:coin_name', async (req, res, next) => {
  try {
    const price = await getPrice(req.params.coin_name);
    if (price === null) {
      const error = new Error('잘못된 이름의 코인이거나 등록되지 않은 코인입니다.');
      error.status = 400;
      return next(error);
    }
    res.send({ price });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
