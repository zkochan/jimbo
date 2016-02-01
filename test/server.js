'use strict'
const Server = require('../lib/server')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const joi = require('joi')

chai.use(sinonChai)
chai.use(chaiAsPromised)

describe('Server method validation', function() {
  it('should not execute handler if validation fails', function(done) {
    let server = new Server()

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

  it('should return error if handler returns error', function(done) {
    let server = new Server()

    server.method({
      name: 'foo',
      config: {
        validate: {
          bar: joi.string().required(),
        },
      },
      handler: params => {throw new Error('error')},
    })

    let res = server
      .inject({
        methodName: 'foo',
        params: {
          bar: 'some string',
        },
      })

    expect(res).to.be.rejectedWith(Error, 'error').notify(done)
  })

  it('should execute handler if with any params is validation not specified', function() {
    let server = new Server()

    let handlerSpy = sinon.spy((params, cb) => {
      expect(params.bar).to.eq('some string')
      cb()
    })

    server.method({
      name: 'foo',
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
  it('should return a promise', function(done) {
    let server = new Server()

    return server.register([]).then(done)
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
  it('should throw exception if no name passed', function() {
    let server = new Server()

    expect(() => server.method()).to.throw(Error, 'name is required')
  })

  it('should throw exception if no handler passed', function() {
    let server = new Server()

    expect(() => server.method({
      name: 'foo',
    })).to.throw(Error, 'handler is required')
  })

  it('should work with callbacks', function(done) {
    let server = new Server()

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

  it('should support methods returning promises', function(done) {
    let server = new Server()

    server.method({
      name: 'foo',
      handler(params) {
        return Promise.resolve('bar')
      },
    })

    server.methods.foo({}, (err, res) => {
      expect(err).to.not.exist
      expect(res).to.eq('bar')
      done()
    })
  })
})
