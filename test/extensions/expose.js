'use strict'
const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)

const Remi = require('remi')
const expose = require('../../lib/extensions/expose')

describe('plugin expose', function() {
  it('should expose property', function(done) {
    function plugin(app, options, next) {
      app.expose('foo', 1)
      return next()
    }
    plugin.attributes = {
      name: 'plugin',
      version: '0.0.0',
    }

    let app = {}
    new Remi({
      extensions: [expose],
    }).register(app, plugin, function(err, app) {
      expect(err).to.not.exist
      expect(app.plugins.plugin.foo).to.eq(1)

      done()
    })
  })

  it('should expose object', function(done) {
    function plugin(app, options, next) {
      app.expose({
        foo: 1,
        bar: 3,
      })
      return next()
    }
    plugin.attributes = {
      name: 'plugin',
      version: '0.0.0',
    }

    let app = {}
    new Remi({
      extensions: [expose],
    }).register(app, plugin, function(err, app) {
      expect(err).to.not.exist
      expect(app.plugins.plugin.foo).to.eq(1)
      expect(app.plugins.plugin.bar).to.eq(3)

      done()
    })
  })

  it('should have a plugin namespace in plugins', function(done) {
    function plugin(app, options, next) {
      expect(app.plugins['foo-plugin']).to.be.not.undefined
      return next()
    }
    plugin.attributes = {
      name: 'foo-plugin',
      version: '0.0.0',
    }

    let app = {}
    new Remi({
      extensions: [expose],
    }).register(app, plugin, function(err) {
      expect(err).to.not.exist
      expect(app.plugins['foo-plugin']).to.be.not.undefined

      done()
    })
  })

  it('should share the plugin namespace through register invocations', function() {
    function plugin(app, options, next) {
      expect(app.plugins['foo-plugin']).to.be.not.undefined
      return next()
    }
    plugin.attributes = {
      name: 'foo-plugin',
      version: '0.0.0',
    }

    function noopPlugin(app, options, next) {
      next()
    }
    noopPlugin.attributes = {
      name: 'noop-plugin',
    }

    let app = {}
    let remi = new Remi({
      extensions: [expose],
    })

    return remi
      .register(app, plugin, {})
      .then(() => {
        expect(app.plugins['foo-plugin']).to.be.not.undefined

        return remi.register(app, [noopPlugin], {})
      })
      .then(() => {
        expect(app.plugins).to.be.not.undefined
        expect(app.plugins['foo-plugin']).to.be.not.undefined
      })
  })
})
