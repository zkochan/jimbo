'use strict'
const uva = require('uva-amqp')
const Remi = require('remi')
const joi = require('joi')
const thenify = require('thenify').withCallback
const debug = require('debug')('jimbo')
const runAsync = require('run-async-cb')

function Server() {
  this.methods = {}
  this._remi = new Remi({
    extensions: [
      require('./extensions/decorate'),
      require('./extensions/expose'),
    ],
  })
}

Server.prototype.connection = function(opts) {
  this._connectionOpts = opts
}

Server.prototype.register = function(plugins, cb) {
  let args = [this, plugins, {}]
  if (cb) args.push(cb)

  return this._remi.register.apply(this._remi, args)
}

Server.prototype.start = thenify(function(cb) {
  this._server = new uva.Server(this._connectionOpts)

  for (let methodName in this.methods)
    this._server.addMethod(methodName, this.methods[methodName])

  cb()
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

  function method(params, cb) {
    let handler = runAsync({fixedLength: true}, opts.handler, cb)
    debug(opts.name + ' called')

    validationFunc(params, function(err, params) {
      if (err) {
        debug(opts.name + ' validation failed: ' +
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
