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

// Function to decode flic.kr urls
// Based on http://www.flickr.com/groups/api/discuss/72157616713786392/
function base58_decode(num) {
    var alpha = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    var decoded = 0;
    var multi = 1;
    var digit;
    
    while(num.length > 0) {
        digit =num[num.length - 1];
        decoded += multi * alpha.indexOf(digit);
        multi = multi * alpha.length;
        num = num.slice(0, -1);
    }
    
    return decoded;
}

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

console.log(since_id);			
			twit.get('/statuses/mentions.json?include_entities=true&since_id=' + since_id, function(data) {
//console.log(data);

			    if(data.statusCode == 400) console.log(data.data.error);

				// Iterate over returned mentions and store in CouchDB.
				for ( var i = 0; i < data.length; i++) {
					
					// Check if tweet fetched matches since_id (Twitter API bug?)
					if(data[i].id == since_id) {
						continue;
					}
					
					var cur_url = '';
					var internal_id;
					
					// If there is a media_url, use it; otherwise start guessing 
					// which 3rd party service they are using.
					if(data[i].entities && data[i].entities.media) {
					    data[i].tweet_image = data[i].entities.media[0].media_url;
					} else {
                        // If the image url has been shortened by twitter, we need to get the 
                        // expanded url. 
					    var img_urls = (data[i].entities && data[i].entities.urls && data[i].entities.urls[0].expanded_url) ?
					        data[i].entities.urls[0].expanded_url : data[i].text.pull_url();
					        
console.log(img_urls);
                        data[i].tweet_image = '';
                        if(img_urls.length > 0) {
                            cur_url = (typeof(img_urls) == 'string') ? img_urls : img_urls[0];
                            if(cur_url.toLowerCase().indexOf('twitpic') != -1) {
                                internal_id = cur_url.split('/').pop();
                                data[i].tweet_image = 'http://twitpic.com/show/full/'+internal_id;
    console.log('twitpic');                            
                            } else if(cur_url.toLowerCase().indexOf('yfrog') != -1) {
                                //internal_id = cur_url.split('/').pop();
                                data[i].tweet_image = cur_url+':iphone';
    console.log('yfrog');                            
                            } else if(cur_url.toLowerCase().indexOf('lockerz') != -1) {
    console.log('lockerz');
                                data[i].tweet_image = 'http://api.plixi.com/api/tpapi.svc/imagefromurl?url='+cur_url+'&size=mobile';
                            } else if(cur_url.toLowerCase().indexOf('flic.kr') != -1) {
    console.log('flickr');
                                data[i].tweet_image = '';
                            }
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
