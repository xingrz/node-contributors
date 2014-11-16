
/**
 * Module dependencies.
 */

var _             = require('lodash')
  , util          = require('util')
  , EventEmitter  = require('events').EventEmitter
  , request       = require('urllib').request
  , async         = require('async')

var authors = require('./git').authors

var pkg = require('../package.json')

/**
 * Constructor
 */

function Contributors(path, fn) {
  if (!(this instanceof Contributors)) {
    return new Contributors().fetch(path, fn)
  }

  EventEmitter.call(this)
}

util.inherits(Contributors, EventEmitter)
module.exports = Contributors

/**
 * Get git log
 * @param {String} path
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.getLog = function(path, fn) {
  fn = fn || function() {}

  authors(path, function(err, list) {
    if (err) {
      return fn(err)
    } else {
      return fn(null, _.uniq(list, 'email'))
    }
  })

  return this
}

/**
 * Get user profile via GitHub API
 * @param {String} email
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.getProfile = function(email, fn) {
  fn = fn || function() {}

  get('https://api.github.com/search/users', {
    'q': util.format('%s in:email', email)
  }, function(err, data) {
    if (err) {
      return fn(err)
    }

    if (data.items.length < 1) {
      return fn(errorException('Email Not Found', 'EmailNotFoundError'))
    }

    get(data.items[0].url, {}, function(err, data) {
      if (err) {
        return fn(err)
      } else {
        return fn(null, data)
      }
    })
  })

  return this
}

/**
 * Fetching contributors
 * @param {String} path
 * @param {Function} fn
 * @return {Contributors}
 * @api public
 */

Contributors.prototype.fetch = function(path, fn) {
  fn = fn || function() {}
  var self = this

  self.getLog(path, function(err, list) {
    if (err) {
      self.emit('error', err)
      return fn(err)
    }

    var count = list.length
      , result = []

    self.emit('fetching', count)

    async.mapSeries(list, function(item, next) {
      self.getProfile(item.email, function(err, user) {
        if (err) {
          if ('EmailNotFoundError' === err.code) {
            self.emit('fetched')
            return next(null, item)
          } else {
            return next(err)
          }
        } else {
          self.emit('fetched')
          item.name = user.name
          item.web = user.html_url
          return next(null, item)
        }
      })
    }, function(err, list) {
      if (err) {
        self.emit('error', err)
        return fn(err)
      } else {
        var result = {
          generatedAt: Number(new Date())
        , contributors: list
        }
        self.emit('done', result)
        return fn(null, result)
      }
    })
  })

  return self
}

function errorException(message, code) {
  var e = new Error(message)
  if (code) e.name = e.code = e.errno = code
  return e
}

function get(url, qs, callback) {
  return request(url, {
    data: qs
  , dataType: 'json'
  , headers: {
      'user-agent': util.format('node-contributors/%s', pkg.version)
    }
  , timeout: 15000 // network too bad in China
  , gzip: true
  }, function(err, data, res) {
    if (err) {
      return callback(err)
    } else if (res.statusCode >= 400 && res.statusCode < 500) {
      var e = errorException(data.message, 'APIError')
      e.result = data
      e.status = res.statusCode
      return callback(e)
    } else {
      if (isRateLimitExceeded(res.headers)) {
        var reset = parseInt(res.headers['x-ratelimit-reset'])
        if (!isNaN(reset)) {
          var pause = reset * 1000 - new Date() + 10 * 1000
          setTimeout(callback.bind(this, null, data, res), pause)
          return
        }
      }

      return callback(null, data, res)
    }
  })
}

function isRateLimitExceeded(headers) {
  var remaining = parseInt(headers['x-ratelimit-remaining'])
  return !isNaN(remaining) && remaining == 0
}
