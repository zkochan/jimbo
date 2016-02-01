'use strict'
const uva = require('uva-amqp')
const remi = require('remi')
const joi = require('joi')
const thenify = require('thenify').withCallback
const debug = require('debug')('jimbo')
const runAsync = require('run-async')
const chalk = require('chalk')

function extendWithRegister(server) {
  let registrator = remi(server)
  registrator.hook(require('remi-timeout')(5e3))
  registrator.hook(require('remi-runner')())
  registrator.hook(require('remi-dependencies')())
  registrator.hook(require('remi-decorate')())
  registrator.hook(require('remi-expose')())
  registrator.hook(require('remi-realm')())

  server.register = registrator.register
}

module.exports = function() {
  let methods = {}

  let connectionOpts

  function connection(opts) {
    connectionOpts = opts
  }

  let start = thenify(function(cb) {
    uva
      .server(connectionOpts)
      .then(server => {
        for (let methodName in methods)
          server.addMethod(methodName, methods[methodName])

        cb()
      })
  })

  function getValidationFunc(config) {
    if (!config || !config.validate)
      return (params, cb) => cb(null, params)

    let schema = joi.compile(config.validate)
    return (params, cb) => joi.validate(params, schema, cb)
  }

  function method(opts) {
    opts = opts || {}

    if (!opts.name)
      throw new Error('name is required')

    if (!opts.handler)
      throw new Error('handler is required')

    let validationFunc = getValidationFunc(opts.config)

    let handlerName = chalk.magenta(opts.name)
    function _method(params, cb) {
      let handler = runAsync.cb(opts.handler, (err, value) => {
        if (err) {
          debug(handlerName + ' handler failed. Error details: ' +
            err.toString())
          return cb(err, value)
        }

        debug(handlerName + ' handler successfully executed. Result: ' +
          chalk.yellow(JSON.stringify(value)))
        cb(err, value)
      })
      debug(handlerName + ' called with params: ' +
        chalk.yellow(JSON.stringify(params)))

      validationFunc(params, function(err, params) {
        if (err) {
          debug(handlerName + ' validation failed: ' +
            err.details.map(d => d.message).join(', '))
          return cb(err)
        }

        handler(params)
      })
    }

    methods[opts.name] = thenify(_method)
  }

  let inject = thenify(function(opts, cb) {
    methods[opts.methodName](opts.params, cb)
  })

  let jimboServer = {
    methods,
    inject,
    start,
    connection,
    method,
  }

  extendWithRegister(jimboServer)

  return jimboServer
}
