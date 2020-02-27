var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

// USER STORY #12: Functional tests are complete and passing
// NOTE: Tests may time out on slower computers - give them a couple tries and 10/10 should pass

suite('Functional Tests', function() {
  
  // Thread ID's for the thread to test replies and reporting, and the thread to delete
  var refId1;
  var refId2;
  
  // Reply ID to rest reporting and deleting replies
  var repId;
    
  // For POST, I created 2 threads, one to be deleted.
  suite('POST', function() {
    
  // Functional test 1 of 10
      
    test('User Story #4: Create threads', function(done) {      
      chai.request(server)
      .post('/api/threads/test')
      .send({text: "Test 1", delete_password: "testpw"})
      .end(function(err, res){
        assert.equal(res.status, 200);
      });
      
      chai.request(server)
      .post('/api/threads/test')
      .send({text: "Test 2", delete_password: "testpw"})
      .end(function(err, res){
        assert.equal(res.status, 200);
        done();
      });
      
    });
      
  });
    
  // In the process of making these tests, more than 10 threads were added to the test form so this successfully tests for everything but reply length
  suite('GET', function() {
    
  // Functional test 2 of 10
      
    test('User story #6: Get last ten threads', function(done) {
      chai.request(server)
      .get('/api/threads/test')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.property(res.body[1], '_id');
        assert.property(res.body[1], 'created_on');
        assert.property(res.body[1], 'bumped_on');
        assert.property(res.body[1], 'text');
        assert.property(res.body[1], 'replies');
        assert.notProperty(res.body[1], 'reported');
        assert.notProperty(res.body[1], 'delete_password');
        assert.isBelow(res.body.length, 11);
        assert.isBelow(res.body[1].replies.length, 4);
        refId1 = res.body[1]._id;
        refId2 = res.body[2]._id;
        done();
      });
    });
      
  });
    
  // Test deletion for both unsuccessful and successful cases, depending on correct password
  suite('DELETE', function() {
    
  // Functional test 3 of 10
      
    test('User Story #8: Delete password (unsuccessful)', function(done) {
      chai.request(server)
      .delete('/api/threads/test')
      .send({thread_id: refId2, delete_password: '1234'})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
    });
  
  // Functional test 4 of 10
      
    test('User Story #8: Delete password (successful)', function(done) {
      chai.request(server)
      .delete('/api/threads/test')
      .send({thread_id: refId2, delete_password: 'testpw'})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
    });
      
  });
    
  suite('PUT', function() {
    
  // Functional test 5 of 10
      
    test('User story #10: Report thread', function(done) {
      chai.request(server)
      .put('/api/threads/test')
      .send({thread_id: refId1})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
    });
      
  });
  
  // Post a reply to the thread that wasn't deleted
  suite('POST', function() {
    
  // Functional test 6 of 10
      
    test('User Story #5: Post reply to thread', function(done) {
      chai.request(server)
      .post('/api/replies/test')
      .send({thread_id: refId1, text:'test reply', delete_password:'testpw'})
      .end(function(err, res){
        assert.equal(res.status, 200);
        done();
      });
    });
      
  });
    
  suite('GET', function() {
    
  // Functional test 7 of 10
    
    test('User story #7: Get all replies to thread', function(done) {
      chai.request(server)
      .get('/api/replies/test')
      .query({thread_id: refId1})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isAbove(res.body.length, 1);
        assert.property(res.body[1], 'text');
        assert.property(res.body[1], '_id');
        assert.property(res.body[1], 'created_on');
        assert.notProperty(res.body[1], 'delete_password');
        assert.notProperty(res.body[1], 'reported');
        repId = res.body[1].id;
        done();
      });
    });
      
  });
    
  suite('PUT', function() {
    
  // Functional test 8 of 10
      
    test('User story #11: Report reply', function(done) {
      chai.request(server)
      .put('/api/threads/test')
      .send({thread_id: refId1, reply_id: repId})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
    });
      
  });
    
  // Test deleting the one reply, with both correct and incorrect password
  suite('DELETE', function() {
    
  // Functional test 9 of 10
      
    test('USER STORY #9: Delete reply (unsuccessful)', function(done) {
      chai.request(server)
      .delete('/api/threads/test')
      .send({thread_id: refId1, reply_id: repId, delete_password: '1234'})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
    });
    
  // Functional test 10 of 10
      
    test('USER STORY #9: Delete reply (successful)', function(done) {
      chai.request(server)
      .delete('/api/threads/test')
      .send({thread_id: refId1, reply_id: repId, delete_password: 'testpw'})
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
    });
      
  });
  
});