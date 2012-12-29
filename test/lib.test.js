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

    describe('.getEmails()', function() {

      it('should be ok', function() {
        should.exists(instance.getEmails)
      })

      it('should return the instance of Contributors', function() {
        instance.getEmails().should.be.an.instanceOf(Contributors)
      })

      it('should callback an array of emails in a git repo', function(done) {
        instance.getEmails('./', function(err, emails) {
          should.not.exist(err)
          emails.should.be.ok
          emails.should.be.an.instanceOf(Array)
          emails.should.not.be.empty
          done()
        })
      })

      it('should callback an empty array if not in a git repo', function(done) {
        instance.getEmails('/tmp', function(err, emails) {
          should.not.exist(err)
          emails.should.be.ok
          emails.should.be.an.instanceOf(Array)
          emails.should.be.empty
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

      it('should callback an error with status code 404 if not exists', function(done) {
        instance.getProfile('(a fake email not exists)', function(err, user) {
          should.exists(err)
          should.exists(err.code)
          should.exists(err.status)
          err.code.should.equal('APIError')
          err.status.should.equal(404)
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

    })
  })
})
