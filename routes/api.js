'use strict';

var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  
  // USER STORY #6: Can GET array with most recent 10 bumped threads, with only the last three replies; hide password and reported fields
    .get(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test')
        db.collection(board).find().toArray((err, docs) => {
          var lastTenThreads = [""]; // First element in array tells user how many replies are being shown/hidden
          // Only shows last ten threads
          for (var i = docs.length-1; i >= 0 && i > docs.length-10; i--) {
            var replies = [];
            if (docs[i].replies.length > 0) {
              // Only shows last three replies
              for (var j = docs[i].replies.length-1; j >= 0 && j > docs[i].replies.length-4; j--) {
                replies.push({text: docs[i].replies[j].text, _id: docs[i].replies[j].id, created_on: docs[i].replies[j].created_on})
              }
            }
            lastTenThreads.push({text: docs[i].text, _id: docs[i]._id, created_on: docs[i].created_on, bumped_on: docs[i].bumped_on, 
                                 replies: replies, showing: replies.length + " of " + docs[i].replies.length + " replies"})
            var topicsShown = 10;
            if (lastTenThreads.length < 10) {
              var topicsShown = lastTenThreads.length-1
            }
            lastTenThreads[0] = "Showing " + topicsShown + " of " + docs.length + " threads: "
          }
          return res.json(lastTenThreads);
        })
      })
    
    })
  
  // USER STORY #4: Can POST a thread by entering a message and password, and a bunch of fields will be created and saved
    .post(function (req, res) {
      var board = req.params.board;
      var thread = {text: req.body.text, delete_password: req.body.delete_password, created_on: new Date().toLocaleString(), 
                    bumped_on: new Date().toLocaleString(), reported: false, replies: []}
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test');
        db.collection(board).insertOne(thread, (err, docs) => {
          if (err) {
            res.send(err)
          } else {
            res.redirect('/b/' + board + '/');
          }
        })
      })
    })
  
  // USER STORY #10: Can report a thread (reported => true) by sending a PUT request to /api/threads/{board} with thread_id. (Text response will be 'success')
    .put(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test');
        db.collection(board).findAndModify({_id: new ObjectId(req.body.thread_id)}, [], { $set: { reported : "true" } }, (err, doc) => {
          if (doc.value !== null) {
            res.send("success")
          }
        })
      })
    })
  
  // USER STORY #8: I can DELETE a thread by posting thread_id & delete_password. Text response will be 'incorrect password' or 'success'
    .delete(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test');
        // requires correct thread ID and it's password
        db.collection(board).findOneAndDelete({_id: new ObjectId(req.body.thread_id), delete_password: req.body.delete_password}, (err, doc) => {
          if (doc.value === null) {
            res.send("incorrect password")
          } else {
            res.send("success")
          }
        })
      })
    })
    
  app.route('/api/replies/:board')
  
  // USER STORY #7: Can GET entire thread with all it's replies from /api/replies/{board}?thread_id={thread_id} (pw, reported still hidden)
    .get(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test');
        db.collection(board).find({_id: new ObjectId(req.query.thread_id)}).toArray( (err, docs) => {
          if (err) {
            res.send(err)
          }
          // Give some info about the thread  
          var replies = [{text: docs[0].text, post_id: docs[0]._id, created_on: docs[0].created_on, number_of_replies: docs[0].replies.length}];
          for (var i = 0; i < docs[0].replies.length; i++) {
            replies.push({reply: i+1, text: docs[0].replies[i].text, _id: docs[0].replies[i].id, created_on: docs[0].replies[i].created_on})
          }
          res.json(replies) 
        })
      })
    })
  
  // USER STORY #5: Can post a reply to a thread by posting the matching thread ID, text content and password
    .post(function (req, res) {
      var board = req.params.board;
      var reply = {id: new ObjectId(), text: req.body.text, created_on: new Date().toLocaleString(), password: req.body.delete_password, reported: false};
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test')
        // As reply to object's replies array, update the bumped_on but not created_on date
        db.collection(board).findAndModify({_id: new ObjectId(req.body.thread_id)}, [], { $set: {bumped_on: new Date().toLocaleString()}, $push: { replies: reply } })
          .catch(err)
          .then( (updatedDoc) => {
            if (updatedDoc) {
              res.redirect('/b/' + board + '/' + req.body.thread_id);
            } else {            
              res.send('could not update ' + req.body._id)
            }
          })
      })
    })
  
  // USER STORY #11: I can report a reply and change it's reported value to true by sending a PUT request to /api/replies/{board} and pass along the thread_id & reply_id. (Text response will be 'success')
    .put(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test');
        // Need both correct thread and reply ID's to report a reply
        db.collection(board).findAndModify({_id: new ObjectId(req.body.thread_id), "replies.id": new ObjectId(req.body.reply_id) }, [],
        { $set: {"replies.$.reported": "true"} }, (err, doc) => {
          if (doc.value !== null) {
            res.send("success")
          }  
        })
      })
    })
  
  // USER STORY #9: Can delete a reply (set to "deleted") if I send a DELETE request to /api/replies/{board} with thread_id, reply_id, & delete_password.
    .delete(function (req, res) {
      var board = req.params.board;
      MongoClient.connect(process.env.DB, {useUnifiedTopology : true}, (err, client) => {
        var db = client.db('test')
        db.collection(board).findAndModify(
        { _id: new ObjectId(req.body.thread_id), replies: { $elemMatch: { id: new ObjectId(req.body.reply_id), password: req.body.delete_password } } }, [],
        { $set: { "replies.$.text": "[deleted]" } }, (err, doc) => {
          if (doc.value === null) {
            res.send('incorrect password');
          } else {
            res.send('success');
          }
        });
      })
    })

};