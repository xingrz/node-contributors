var should = require('should')
var Contributors = require('../')

describe('contributors.js', function() {
  describe('Contributors', function() {
    var instance = new Contributors()

    it('should be ok', function() {
      instance.should.be.ok
    })

    it('should return an instance of Contributors in static call', function() {
      Contributors().should.be.an.instanceOf(Contributors)
    })

    describe('.getLog()', function() {

      it('should be ok', function() {
        should.exists(instance.getLog)
      })

      it('should return the instance of Contributors', function() {
        instance.getLog().should.be.an.instanceOf(Contributors)
      })

      it('should callback an array of contributors in a git repo', function(done) {
        instance.getLog('./', function(err, contributors) {
          should.not.exist(err)
          contributors.should.be.ok
          contributors.should.be.an.instanceOf(Array)
          contributors.should.containEql({
            name: 'XiNGRZ'
          , email: 'chenxingyu92@gmail.com'
          })
          done()
        })
      })

      it('should callback an error if not in a git repo', function(done) {
        instance.getLog('/tmp', function(err) {
          should.exists(err)
          should.exists(err.code)
          err.code.should.equal('GITError')
          done()
        })
      })

    })

    describe('.getProfile()', function() {

      it('should be ok', function() {
        should.exists(instance.getProfile)
      })

      it('should return the instance of Contributors', function() {
        instance.getProfile().should.be.an.instanceOf(Contributors)
      })

      it('should callback an object if exists', function(done) {
        instance.getProfile('chenxingyu92@gmail.com', function(err, user) {
          should.not.exists(err)
          user.should.be.ok
          user.should.be.an.instanceOf(Object)
          should.exists(user.name)
          done()
        })
      })

      it('should callback EmailNotFoundError if not exists', function(done) {
        instance.getProfile('(a fake email not exists)', function(err) {
          should.exists(err)
          should.exists(err.code)
          err.code.should.equal('EmailNotFoundError')
          done()
        })
      })

    })

    describe('.fetch()', function() {

      it('should be ok', function() {
        should.exists(instance.fetch)
      })

      it('should return the instance of Contributors', function() {
        instance.fetch().should.be.an.instanceOf(Contributors)
      })

      it('should callback an object if successed', function(done) {
        instance.fetch('./', function(err, result) {
          should.not.exists(err)
          result.should.be.ok
          result.should.be.an.instanceOf(Object)
          should.exists(result.generatedAt)
          should.exists(result.contributors)
          result.generatedAt.should.be.a.Number
          result.contributors.should.be.an.instanceOf(Array)
          done()
        })
      })

      it('should callback an error if not in a git repo', function(done) {
        instance.on('error', function() {}) // so that it won't be throwed by EventEmitter
        instance.fetch('/tmp', function(err) {
          should.exists(err)
          should.exists(err.code)
          err.code.should.equal('GITError')
          done()
        })
      })

    })
  })
})
