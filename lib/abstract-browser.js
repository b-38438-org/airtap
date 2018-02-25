'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const debug = require('debug')

function AbstractBrowser (opt, conf) {
  if (!(this instanceof AbstractBrowser)) {
    return new AbstractBrowser(opt, conf)
  }

  EventEmitter.call(this)

  if (!opt) opt = {}
  if (!conf) conf = {}

  this._opt = opt
  this._conf = conf

  this.debug = debug(['airtap', conf.browser, conf.version].filter(Boolean).join(':'))
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
  var conf = this._conf
  return '<' + [conf.browser, conf.version].filter(Boolean).join(' ') + '>'
}

// TODO refactor this
AbstractBrowser.prototype.shutdown = function (err) {
  var self = this

  function done () {
    if (err) {
      return self.emit('error', err)
    }

    self.emit('done', self.stats)
  }

  if (this.controller) {
    this.controller.shutdown(done)
  } else {
    done()
  }
}
