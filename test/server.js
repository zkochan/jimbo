'use strict'

const Server = require('../lib/server')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect
const joi = require('joi')

chai.use(sinonChai);

describe('Server method validation', function() {
  it('should not execute handler if validation fails', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    let handlerSpy = sinon.spy()

    server.method({
      name: 'foo',
      config: {
        validate: {
          bar: joi.string().required(),
        },
      },
      handler: handlerSpy,
    })

    server.inject({
      methodName: 'foo',
      params: {
        bar: 1,
      },
    }, err => {
      expect(err).to.be.instanceOf(Error)
      expect(err.details[0].message).to.eq('"bar" must be a string')

      expect(handlerSpy).to.not.have.been.called

      done()
    })
  })

  it('should execute handler if validation passes', function() {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    let handlerSpy = sinon.spy((params, cb) => {
      expect(params.bar).to.eq('some string')
      cb()
    })

    server.method({
      name: 'foo',
      config: {
        validate: {
          bar: joi.string().required(),
        },
      },
      handler: handlerSpy,
    })

    return server
      .inject({
        methodName: 'foo',
        params: {
          bar: 'some string',
        },
      })
      .then(() => {
        expect(handlerSpy).to.have.been.calledOnce
      })
  })
})

describe('Server register', function() {
  it('should work with callbacks', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    server.register([], () => done())
  })

  it('should return a promise', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    return server.register([]).then(() => done())
  })
})

describe('Server start', function() {
  it('should work with callbacks', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    server.start(() => done())
  })

  it('should return a promise', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    return server.start().then(() => done())
  })
})

describe('Server methods', function() {
  it('should work with callbacks', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    server.method({
      name: 'foo',
      handler(params, cb) {
        cb(null, 'bar')
      },
    })

    server.methods.foo({}, (err, res) => {
      expect(err).to.not.exist
      expect(res).to.eq('bar')
      done()
    })
  })

  it('should return a promise', function(done) {
    let server = new Server()

    server.connection({
      channel: 'tests',
      url: 'amqp://guest:guest@localhost:5672',
    })

    server.method({
      name: 'foo',
      handler(params, cb) {
        cb(null, 'bar')
      },
    })

    return server.methods.foo({}).then(res => {
      expect(res).to.eq('bar')
      done()
    })
  })
})
