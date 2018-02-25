'use strict'

const test = require('tape')
const SauceBrowser = require('../../lib/sauce-browser')
const abstractSuite = require('./abstract-browser')

abstractSuite('SauceBrowser', SauceBrowser)

test('SauceBrowser toString', function (t) {
  const browser = new SauceBrowser({
    name: 'chrome',
    version: '64',
    platform: 'Linux'
  })

  t.is(browser.toString(), '<chrome 64 on Linux>')
  t.end()
})
