'use strict'

const path = require('path')

async function createConfigFile(cli) {
    try {
        await cli.copy(path.join(__dirname, './config/index.js'), path.join(cli.helpers.configPath(), 'serviceoCore.js'))
        cli.command.completed('create', 'config/serviceoCore.js')
    } catch (e) { }
}

module.exports = async function (cli) {
    createConfigFile(cli)
}
