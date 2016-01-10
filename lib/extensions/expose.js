'use strict'

const merge = require('merge')

module.exports = function(remi, opts) {
  remi.pre('createPlugin', function(next, target, plugin) {
    target.plugins = target.plugins || {}
    target.root.plugins = target.plugins
    target.plugins[plugin.name] = target.plugins[plugin.name] || {}

    next(merge(target, {
      expose(key, value) {
        if (typeof key === 'string') {
          target.plugins[plugin.name][key] = value
          return
        }
        target.plugins[plugin.name] = merge(target.plugins[plugin.name], key)
      },
    }), plugin)
  })
}
