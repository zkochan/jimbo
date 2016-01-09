'use strict'

const merge = require('merge')

module.exports = function(remi, opts) {
  let plugins = {}

  remi.pre('createPlugin', function(next, target, plugin) {
    plugins[plugin.name] = plugins[plugin.name] || {}

    target.root.plugins = plugins

    next(merge(target, {
      plugins,
      expose(key, value) {
        if (typeof key === 'string') {
          plugins[plugin.name][key] = value
          return
        }
        plugins[plugin.name] = merge(plugins[plugin.name], key)
      },
    }), plugin)
  })
}
