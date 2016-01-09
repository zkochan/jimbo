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

  it('should execute handler if validation passes', function(done) {
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

    server.inject({
      methodName: 'foo',
      params: {
        bar: 'some string',
      },
    }, err => {
      expect(err).to.not.exist

      expect(handlerSpy).to.have.been.calledOnce

      done()
    })
  })
})
