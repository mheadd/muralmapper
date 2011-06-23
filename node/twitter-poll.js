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
	  sys.puts('An unhandled exception occurred: ' + err);
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

// From http://www.simonwhatley.co.uk/examples/twitter/prototype/
String.prototype.pull_url = function() {
    if(this.indexOf('yfrog') != -1) {
		return  'http://'+this.match(/yfrog.com\/[A-Za-z0-9-_]+/g, function(url) {
			return url;
		});
	} else {
      	return this.match(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
      		return url;
      	});
    }
};

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
//console.log("About to call: "+'/statuses/mentions.json?since_id=' + since_id);
			twit.get('/statuses/mentions.json?since_id=' + since_id, function(data) {
                console.log("data: ");
                console.log(data);
                
			    if(data.statusCode == 400) console.log(data.data.error);

				// Iterate over returned mentions and store in CouchDB.
				for ( var i = 0; i < data.length; i++) {
					
					// Check if tweet fetched matches since_id (Twitter API bug?)
					if(data[i].id == since_id) {
						continue;
					}
					
					var cur_url = '';
					var internal_id;
					var img_urls = data[i].text.pull_url();
console.log("img_url = ");
console.log(img_urls);
                    data[i].tweet_image = '';
                    if(img_urls.length > 0) {
                        cur_url = (typeof(img_urls) == 'string') ? img_urls : img_urls[0];
                        if(cur_url.toLowerCase().indexOf('twitpic') != -1) {
                            internal_id = cur_url.split('/').pop();
                            data[i].tweet_image = 'http://twitpic.com/show/full/'+internal_id;
                        } else if(cur_url.toLowerCase().indexOf('yfrog') != -1) {
                            //internal_id = cur_url.split('/').pop();
                            data[i].tweet_image = cur_url+':iphone';
                        } else if(cur_url.toLowerCase().indexOf('lockerz') != -1) {
                            data[i].tweet_image = 'http://api.plixi.com/api/tpapi.svc/imagefromurl?url='+cur_url+'&size=mobile';
                        } else {
                            data[i].tweet_image = '';
                        }
                    }
console.log(data[i]);
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
