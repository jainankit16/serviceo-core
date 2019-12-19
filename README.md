# serviceo-core

It is responsible for making an loopback rest api calls for serviceo microservices.


## Usage instructions

1. Register provider inside `start/app.js` file.
const providers = [
  'serviceo-core/providers/ServiceoCoreProvider'
]

2. Configure `auth0` settings (url, grantType, clientId, clientSecret, audience) in `config/auth.js` file.

3. Configure `MS_BASE_URL_ACCOUNT` and `REDIS_TTL` keys (refer `config/serviceoCore.js`) in .env file.