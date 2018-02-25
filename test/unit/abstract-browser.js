'use strict'

const test = require('tape')
const AbstractBrowser = require('../../lib/abstract-browser')

function suite (name, Browser) {
  test(`${name} has stats`, function (t) {
    const browser = new Browser()

    t.same(browser.stats, { passed: 0, failed: 0 })
    t.end()
  })

  test(`${name} takes options`, function (t) {
    const browser = new Browser({ control_port: 1234 })

    t.is(browser._opt.control_port, 1234)
    t.end()
  })
}

suite('AbstractBrowser', AbstractBrowser)

// Export so that implementations can run the same suite.
module.exports = suite
