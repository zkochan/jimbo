'use strict'
const uva = require('uva-amqp')
const remi = require('remi')
const joi = require('joi')
const thenify = require('thenify').withCallback
const debug = require('debug')('jimbo')
const runAsync = require('run-async')
const chalk = require('chalk')

function Server() {
  this.methods = {}

  let registrator = remi(this)
  registrator.hook(require('remi-timeout')(5e3))
  registrator.hook(require('remi-runner')())
  registrator.hook(require('remi-dependencies')())
  registrator.hook(require('remi-decorate')())
  registrator.hook(require('remi-expose')())
  registrator.hook(require('remi-realm')())

  this.register = registrator.register
}

Server.prototype.connection = function(opts) {
  this._connectionOpts = opts
}

Server.prototype.start = thenify(function(cb) {
  uva
    .server(this._connectionOpts)
    .then(server => {
      this._server = server

      for (let methodName in this.methods)
        this._server.addMethod(methodName, this.methods[methodName])

      cb()
    })
})

Server.prototype._getValidationFunc = function(config) {
  if (!config || !config.validate)
    return (params, cb) => cb(null, params)

  let schema = joi.compile(config.validate)
  return (params, cb) => joi.validate(params, schema, cb)
}

Server.prototype.method = function(opts) {
  opts = opts || {}

  if (!opts.name)
    throw new Error('name is required')

  if (!opts.handler)
    throw new Error('handler is required')

  let validationFunc = this._getValidationFunc(opts.config)

  let handlerName = chalk.magenta(opts.name)
  function method(params, cb) {
    let handler = runAsync.cb(opts.handler, (err, value) => {
      if (err) {
        debug(handlerName + ' handler failed. Error details: ' + err.toString())
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

  this.methods[opts.name] = thenify(method)
}

Server.prototype.inject = thenify(function(opts, cb) {
  this.methods[opts.methodName](opts.params, cb)
})

module.exports = Server
