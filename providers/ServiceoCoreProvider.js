'use strict'

const ServiceProvider = require('adonis-fold').ServiceProvider

class ServiceoCoreProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  * register () {
    this.app.bind('Adonis/Addons/Serviceo/Core', (app) => {
      const Config = app.use('Adonis/Src/Config')
      const ServiceoCore = require('../src/ServiceoCore')
      return new ServiceoCore(Config)
    })
    this.app.alias('Adonis/Addons/Serviceo/Core', 'Serviceo/Core')
  }

  /**
   * Attach context getter when all providers have
   * been registered
   *
   * @method boot
   *
   * @return {void}
   */
  boot() {
    //
  }
}

module.exports = ServiceoCoreProvider
