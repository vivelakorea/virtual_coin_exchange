/* eslint-disable no-console */
// libraries
const express = require('express');
const dotenv = require('dotenv');

// self made libraries
const connect = require('./connect');
const registerCoin = require('./registerCoin');

// for my security life..
dotenv.config();

// routers
const homeRouter = require('./routes/home');
const coinsRouter = require('./routes/coins');

const app = express();
app.set('port', process.env.PORT = process.env.PORT || 8001);

// connect
connect();

// 잡다한 설정들
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// coin들 coins collection에 넣기
registerCoin('usd');
registerCoin('btc', 'bitcoin');
registerCoin('xrp', 'ripple');
registerCoin('bch', 'bitcoin-cash');
registerCoin('eth', 'ethereum');
registerCoin('usdt', 'tether');
registerCoin('link', 'chainlink');

// route들에 routers 연결
app.use('/', homeRouter);
app.use('/coins', coinsRouter);

// 여기까지 왔다면 라우터가 없는 것.. 404 띄워드립니다
app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} doesn't exist`);
  error.status = 404;
  next(error);
});

// 에러처리반
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const { message, status } = err;
  // err에 status를 따로 안먹였으면 500
  res.status(err.status || 500).send({
    error: { message, status: status || 500 },
  });
});

app.listen(app.get('port'), () => {
  console.log(`listening on: http://localhost:${app.get('port')}`);
});
