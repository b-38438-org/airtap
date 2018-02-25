'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const debug = require('debug')
const createTestServer = require('./setup')

function AbstractBrowser (opt) {
  if (!(this instanceof AbstractBrowser)) {
    return new AbstractBrowser(opt)
  }

  EventEmitter.call(this)

  if (!opt) opt = {}

  this._opt = opt
  this.debug = debug(['airtap', opt.name, opt.version].filter(Boolean).join(':'))
  this.resetStats()
}

inherits(AbstractBrowser, EventEmitter)

module.exports = AbstractBrowser

AbstractBrowser.prototype.resetStats = function () {
  this.stats = {
    passed: 0,
    failed: 0
  }
}

AbstractBrowser.prototype.toString = function () {
  var opt = this._opt
  return '<' + [opt.name, opt.version].filter(Boolean).join(' ') + '>'
}

AbstractBrowser.prototype.start = function (callback) {
  var self = this

  self.resetStats()
  self.debug('start')

  self.controller = createTestServer(self._opt, function (err, url) {
    // If controller did not start, there's no need to shutdown
    if (err) return callback(err)

    self._start(url, function (err1) {
      self._shutdown(function (err2) {
        self.controller.shutdown(function (err3) {
          finish(err1 || err2 || err3)
        })
      })
    })
  })

  function finish (err) {
    self.debug('stop')

    if (err) {
      // Prefix browser err message with browser version
      err.message = self.toString() + ' ' + err.message
      return callback(err)
    }

    // NOTE: still need to emit done for unit tests
    self.emit('done', self.stats)
    self.removeAllListeners()

    callback(null, self.stats)
  }
}

AbstractBrowser.prototype._start = function (url, callback) {
  process.nextTick(callback)
}

AbstractBrowser.prototype._shutdown = function (callback) {
  process.nextTick(callback)
}
