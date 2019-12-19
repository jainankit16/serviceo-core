'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class ServiceoCoreProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register() {
    this.app.singleton('Serviceo/Core', () => {
      const Config = this.app.use('Adonis/Src/Config')
      const ServiceoCore = require('../src/ServiceoCore')
      return new ServiceoCore(Config)
    })
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
