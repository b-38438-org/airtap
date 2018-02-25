var wd = require('wd')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var FirefoxProfile = require('firefox-profile')
var AbstractBrowser = require('./abstract-browser')

function SauceBrowser (opt) {
  if (!(this instanceof SauceBrowser)) {
    return new SauceBrowser(opt)
  }

  AbstractBrowser.call(this, opt)
}

inherits(SauceBrowser, AbstractBrowser)

// Override AbstractBrowser#toString to add platform
SauceBrowser.prototype.toString = function () {
  var opt = this._opt
  return '<' + opt.name + ' ' + opt.version + ' on ' + opt.platform + '>'
}

SauceBrowser.prototype._start = function (url, callback) {
  var self = this

  self.stopped = false
  var webdriver = self.webdriver = wd.remote('ondemand.saucelabs.com', 80, self._opt.username, self._opt.key)

  var initOpts = Object.assign({
    build: process.env.TRAVIS_BUILD_NUMBER,
    name: self._opt.project,
    tags: self._opt.tags || [], // TODO: not defined in options
    browserName: self._opt.name,
    version: self._opt.version,
    platform: self._opt.platform
  }, self._opt.capabilities)

  self.emit('init', initOpts)

  // use the SAUCE_APPIUM_VERSION environment variable to specify the
  // Appium version. If not specified the test will run against the
  // default Appium version
  if (process.env.SAUCE_APPIUM_VERSION) {
    initOpts['appium-version'] = process.env.SAUCE_APPIUM_VERSION
  }

  // configures sauce connect with a tunnel identifier
  // if sauce_connect is true, use the TRAVIS_JOB_NUMBER environment variable
  // otherwise use the contents of the sauce_connect variable
  if (self._opt.sauce_connect) {
    var tunnelId = self._opt.sauce_connect !== true ? self._opt.sauce_connect : process.env.TRAVIS_JOB_NUMBER
    if (tunnelId) {
      initOpts['tunnel-identifier'] = tunnelId
    }
  }

  if (self._opt.firefox_profile) {
    var fp = new FirefoxProfile()
    var extensions = self._opt.firefox_profile.extensions
    for (var preference in self._opt.firefox_profile) {
      if (preference !== 'extensions') {
        fp.setPreference(preference, self._opt.firefox_profile[preference])
      }
    }
    extensions = extensions || []
    fp.addExtensions(extensions, function () {
      fp.encoded(function (zippedProfile) {
        initOpts.firefox_profile = zippedProfile
        init()
      })
    })
  } else {
    init()
  }

  function init () {
    self.debug('queuing')
    self.debug('options: %j', initOpts)

    webdriver.init(initOpts, function (err) {
      if (err) {
        if (err.data) {
          err.message += ': ' + err.data.split('\n').slice(0, 1)
        }
        return callback(err)
      }

      var reporter = new EventEmitter()

      reporter.on('test_end', function (test) {
        if (!test.passed) {
          return self.stats.failed++
        }
        self.stats.passed++
      })

      reporter.on('done', function (results) {
        clearTimeout(self.noOutputTimeout)
        self.debug('done')
        var passed = results.passed
        var called = false
        webdriver.sauceJobStatus(passed, function (err) {
          if (called) {
            return
          }

          called = true
          callback()

          if (err) {

            // don't let this error fail us
          }
        })

        reporter.removeAllListeners()
      })

      self.debug('open %s', url)
      self.emit('start', reporter)

      var timeout = false
      var timer = setTimeout(function () {
        self.debug('timed out waiting for open %s', url)
        timeout = true
        callback(
          new Error('Timeout opening url after ' + Math.round(self._opt.browser_open_timeout / 1000) + 's')
        )
      }, self._opt.browser_open_timeout)

      webdriver.get(url, function (err) {
        self.debug('browser opened url')

        if (timeout) {
          return
        }

        clearTimeout(timer)

        if (err) {
          return callback(err)
        }

        // no new output for 30s => error
        watchOutput()

        function watchOutput () {
          if (self._opt.browser_output_timeout === -1) {
            return
          }

          clearTimeout(self.noOutputTimeout)

          self.noOutputTimeout = setTimeout(function () {
            callback(
              new Error('Did not receive any new output from browser for ' + Math.round(self._opt.browser_output_timeout / 1000) + 's, shutting down')
            )
          }, self._opt.browser_output_timeout)
        }

        (function wait () {
          if (self.stopped) {
            return
          }

          self.debug('waiting for test results from %s', url)
          // take the last 1000 log lines
          // careful, the less you log lines, the slower your test
          // result will be. The test could be finished in the browser
          // but not in your console since it can take a lot
          // of time to get a lot of results
          var js = '(window.zuul_msg_bus ? window.zuul_msg_bus.splice(0, 1000) : []);'
          webdriver.eval(js, function (err, res) {
            if (err) {
              self.debug('err: %s', err.message)
              return callback(err)
            }

            res = res || []
            // When testing with microsoft edge:
            // Adds length property to array-like object if not defined to execute filter properly
            if (res.length === undefined) {
              res.length = Object.keys(res).length
            }
            self.debug('res.length: %s', res.length)

            // if we received some data, reset the no output watch timeout
            if (res.length > 0) {
              watchOutput()
            }

            var isDone = false
            Array.prototype.filter.call(res, Boolean).forEach(function (msg) {
              if (msg.type === 'done') {
                isDone = true
              }

              reporter.emit(msg.type, msg)
            })

            if (isDone) {
              self.debug('finished tests for %s', url)
              return
            }

            self.debug('fetching more results')

            // if we found results, let's not wait
            // to get more
            if (res.length > 0) {
              process.nextTick(wait)
            } else {
              // otherwise, let's wait a little so that we do not
              // spam saucelabs
              setTimeout(wait, 2000)
            }
          })
        })()
      })
    })
  }
}

SauceBrowser.prototype._shutdown = function (done) {
  var self = this

  clearTimeout(self.noOutputTimeout)

  self.stopped = true

  // make sure the browser shuts down before continuing
  if (self.webdriver) {
    self.debug('quitting browser')

    var timeout = false
    var timer = setTimeout(function () {
      self.debug('timed out waiting for browser to quit')
      timeout = true
      done()
    }, 10 * 1000)

    self.webdriver.quit(function (err) {
      if (timeout) {
        return
      }

      clearTimeout(timer)
      done(err)
    })
  } else {
    done()
  }
}

module.exports = SauceBrowser
