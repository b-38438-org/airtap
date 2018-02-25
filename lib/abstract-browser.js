'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const debug = require('debug')

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

// TODO refactor this
AbstractBrowser.prototype.shutdown = function (err) {
  var self = this

  function done (err2) {
    self.debug('shutdown')

    err = err || err2

    if (err) {
      // Prefix browser err message with browser version
      err.message = self.toString() + ' ' + err.message
      return self.emit('error', err)
    }

    self.emit('done', self.stats)
    self.removeAllListeners()
  }

  self._shutdown(function (err) {
    if (self.controller) {
      self.controller.shutdown(function (err2) {
        done(err || err2)
      })
    } else {
      done(err)
    }
  })
}

AbstractBrowser.prototype._shutdown = function (done) {
  process.nextTick(done)
}
