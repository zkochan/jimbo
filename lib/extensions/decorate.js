'use strict'

const merge = require('merge')

module.exports = function(remi, opts) {
  let extension = {
    decorate(type, prop, method) {
      if (type !== 'server')
        throw new Error('Only "server" type is supported')

      if (typeof prop === 'string') {
        extension[prop] = method
      } else if (typeof prop === 'object') {
        merge(extension, prop)
      } else {
        throw new Error('invalid arguments passed to decorate')
      }

      merge(this, extension)
      merge(this.root, extension)
    },
  }

  remi.pre('createPlugin', function(next, target, plugin) {
    next(merge(target, extension), plugin)
  })
}
