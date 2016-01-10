'use strict';

const uva = require('uva-amqp')
const Remi = require('remi')
const joi = require('joi')
const thenify = require('thenify').withCallback

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
  this._server = new uva.Server(opts)
}

Server.prototype.register = function(plugins, cb) {
  let args = [this, plugins, {}]
  if (cb) args.push(cb)

  return this._remi.register.apply(this._remi, args)
}

Server.prototype.start = thenify(function(cb) {
  cb()
})

Server.prototype.method = function(opts) {
  if (!opts.name)
    throw new Error('name is required')

  if (!opts.handler)
    throw new Error('handler is required')

  let validate = opts.config && opts.config.validate || {}
  let schema = joi.compile(validate)
  function validationFunc(params, cb) {
    joi.validate(params, schema, cb)
  }

  function method(params, cb) {
    validationFunc(params, function(err, params) {
      if (err) return cb(err)

      return opts.handler(params, cb)
    })
  }

  this._server.addMethod(opts.name, method)
  this.methods[opts.name] = method
}

Server.prototype.inject = thenify(function(opts, cb) {
  this.methods[opts.methodName](opts.params, cb)
})

module.exports = Server
