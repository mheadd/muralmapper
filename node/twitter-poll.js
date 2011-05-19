/**
 * Node.js script to poll Twitter API and store mentions in a CouchDB instance.
 */

// Include required modules
var sys = require('sys');
var http = require('http');
var twitter = require('twitter');
var cradle = require('cradle');
var config = require('./config');

// Last ditch hander for an exception.
process.on('uncaughtException', function (err) {
	  sys.puts('An unhandled exception occured: ' + err);
});

// Create new Twitter object
var twit = new twitter({
	consumer_key : config.twitter.consumer_key,
	consumer_secret : config.twitter.consumer_secret,
	access_token_key : config.twitter.access_token_key,
	access_token_secret : config.twitter.access_token_secret
});

// Create new connection to CouchDB instance.
var db = new (cradle.Connection)(config.couchdb.host, config.couchdb.port, {
	auth : {
		username : config.couchdb.userid,
		password : config.couchdb.password
	}
}).database(config.couchdb.dbname);

// At a set interval, fetch all mentions
setInterval(function() {

	// At the begining of each poll, get the ID of the last doc inserted.
	db.all({descending: true, limit: 1, skip: 1}, function(err, res) {		
		if(err) {
			sys.puts('Could not fetch last document ID. Unable to poll Twitter API. ' + err.reason);
		}		
		else {
			
			// Use the last document ID to refine twitter API call (if no docs exist, just use an arbitrary low number).
			var since_id = res.length == 0 ? 10000 : res[0].id;
			twit.get('/statuses/mentions.json?since_id=' + since_id, function(data) {

				// Iterate over returned mentions and store in CouchDB.
				for ( var i = 0; i < data.length; i++) {

					db.save('' + data[i].id, data[i], function(err, res) {
						if (err) {
							sys.puts('Could not save document with id ' + data[i].id
									+ '. ' + err.reason);
						} else {
							sys.puts('Saved document with id ' + res.id + '. Rev ID: '
									+ res.rev);
						}
					});
				}
			});
		}
	});
	
}, config.timers.interval);
