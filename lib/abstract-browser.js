'use strict'

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits

function AbstractBrowser (opt) {
  if (!(this instanceof AbstractBrowser)) {
    return new AbstractBrowser(opt)
  }

  EventEmitter.call(this)

  this._opt = opt || {}
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
