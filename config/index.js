'use strict'

/*
|--------------------------------------------------------------------------
| ServiceoCore Configuaration
|--------------------------------------------------------------------------
|
| Here we define the configuration for ServiceoCore.
| 
|
*/

const Env = use('Env')

module.exports = {
    /*
    |--------------------------------------------------------------------------
    | ServiceoCore connection config
    |--------------------------------------------------------------------------
    */
    baseUrl: Env.get('MS_BASE_URL_ACCOUNT', 'http://localhost:8080/api/v1'),
    redisTTL: Env.get('REDIS_TTL', {
        account: 60 * 60 * 3,
        program: 60 * 60 * 3,
        department: 60 * 60 * 6,
        team: 60 * 60 * 6,
        user: 60 * 60,
        job: 60 * 60 * 3
    })
}
