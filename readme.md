# 가상 암호화폐 거래소

* /register : 회원가입
* /login : 로그인
* /assets : 유저의 모든 재산

* /coins : 여기 등록된 모든 코인 목록 반환
* /coins/:coin_name/buy : body에 있는 quantity 만큼 삼
* /coins/:coin_name/buy_all : 모든 usd 소모하여 (단, 코인을 0.0001개 단위로 사고 남을 경우 남김) 해당 코인 구매
* /coins/:coin_name/sell: body에 있는 quantity 만큼 팖
* /coins/:coin_name/sell_all : 가지고 있는 해당 코인 모두 팖