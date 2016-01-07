'use strict';

const Server = require('uva-amqp').Server
const registerPlugin = require('register-plugin');

let defaultValidate = (value, cb) => cb(null, value)

function Service() {
}

Service.prototype.connection = function(opts) {
  this._server = new Server(opts)
};

Service.prototype.register = function(plugins, cb) {
  registerPlugin(this, plugins, {}, cb)
};

Service.prototype.start = function(cb) {
  cb()
};

Service.prototype.method = function(opts) {
  if (!opts.name)
    throw new Error('name is required')

  if (!opts.handler)
    throw new Error('handler is required')

  let validate = opts.config && opts.config.validate || defaultValidate

  this._server.addMethod(opts.name, function(params, cb) {
    validate(params, function(err, request) {
      if (err) return cb(err)

      return opts.handler(params, cb)
    })
  })
}

exports.Server = Service
