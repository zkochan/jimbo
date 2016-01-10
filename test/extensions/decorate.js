'use strict'

const chai = require('chai')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)

const Remi = require('remi')
const decorate = require('../../lib/extensions/decorate')

describe('decorate', function() {
  it('should decorate with a single property', function(done) {
    function plugin1(app, options, next) {
      app.decorate('server', 'foo', 1)
      expect(app.foo).to.eq(1)
      expect(app.root.foo).to.eq(1)
      return next()
    }
    plugin1.attributes = {
      name: 'plugin1',
      version: '0.0.0',
    }
    function plugin2(app, options, next) {
      expect(app.foo).to.eq(1)
      expect(app.root.foo).to.eq(1)
      return next()
    }
    plugin2.attributes = {
      name: 'plugin2',
      version: '0.1.0',
    }

    let app = {}
    let plugins = [{
      register: plugin1,
      options: {foo: 1},
    }, {
      register: plugin2,
    },]
    new Remi({
      extensions: [decorate],
    }).register(app, plugins, function(err) {
      expect(err).to.not.exist
      expect(app.foo).to.eq(1)
      done()
    })
  })

  it('should decorate with with multiple properties', function(done) {
    function plugin1(app, options, next) {
      app.decorate('server', {
        foo: 1,
      })
      expect(app.foo).to.eq(1)
      expect(app.root.foo).to.eq(1)
      return next()
    }
    plugin1.attributes = {
      name: 'plugin1',
      version: '0.0.0',
    }
    function plugin2(app, options, next) {
      expect(app.foo).to.eq(1)
      expect(app.root.foo).to.eq(1)
      return next()
    }
    plugin2.attributes = {
      name: 'plugin2',
      version: '0.1.0',
    }

    let app = {}
    let plugins = [{
      register: plugin1,
      options: {foo: 1},
    }, {
      register: plugin2,
    },]
    new Remi({
      extensions: [decorate],
    }).register(app, plugins, function(err) {
      expect(err).to.not.exist
      expect(app.foo).to.eq(1)
      done()
    })
  })

  it('should share the decorated elements through register invocations', function() {
    function plugin(app, options, next) {
      app.decorate('server', 'foo', 'bar')
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
      extensions: [decorate],
    })

    return remi
      .register(app, plugin, {})
      .then(() => {
        expect(app.foo).to.eq('bar')

        return remi.register(app, [noopPlugin], {})
      })
      .then(() => {
        expect(app.foo).to.eq('bar')
      })
  })
})
