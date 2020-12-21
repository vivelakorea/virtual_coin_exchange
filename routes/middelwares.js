/* eslint-disable no-console */
// libraries
const jwt = require('jsonwebtoken');

// models
const User = require('../models/user');
const Key = require('../models/key');

// eslint-disable-next-line consistent-return
const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) { // return res.sendStatus(401);
      const error = new Error('There is no authorization data in body');
      error.status = 401;
      return next(error);
    }
    const [bearer, key] = authorization.split(' ');
    if (bearer !== 'Bearer') { // return res.sendStatus(401);
      const error = new Error('There is no bearer');
      error.status = 401;
      return next(error);
    }
    const user = await User.findOne({ key });
    if (!user) { // return res.sendStatus(401);
      const error = new Error('No user found by given key');
      error.status = 401;
      return next(error);
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// eslint-disable-next-line consistent-return
const verifyToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) { // return res.sendStatus(401);
      const error = new Error('There is no authorization data in body');
      error.status = 401;
      next(error);
    }

    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer') { // return res.sendStatus(401);
      const error = new Error('There is no bearer');
      error.status = 401;
      return next(error);
    }

    const decoded = jwt.decode(token, { complete: true });
    const publicKey = decoded.payload.pub;

    const key = await Key.findOne({ publicKey });
    if (!key) {
      const error = new Error('인증 에러');
      error.status = 400;
      return next(error);
    }

    if (new Date() - key.createdAt > 1000 * 60 * 5) { // 5분
      const error = new Error();
      error.name = 'TokenExpiredError';
      throw error;
    }

    jwt.verify(token, key.secretKey);
    req.userId = key.user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') { // 유효 기간 초과
      const { authorization } = req.headers;
      const token = (authorization.split(' '))[1];
      await Key.findOneAndDelete({ token });
      const error = new Error('토큰의 유효 기간이 지났습니다');
      error.status = 419;
      return next(error);
    }
    return next(err);
  }
};
module.exports = { authentication, verifyToken };
