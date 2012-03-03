## Mural Art Mapper 

A CouchDB + Nodejs + Twitter application that crowdsources mural art mapping.

This project has two main pieces: the node script that pulls at-replies from Twitter and the CouchApp which runs the website.

## Deploying the Node Script

All the files for this script live in the (uniquely-titled) "node" folder.  

If you are running the script locally, make sure you've got [node](http://nodejs.org/) & [npm](http://npmjs.org/) up and running.

1. Rename the `config.example.js` file to `config.js` and add enter your configuration details (twitter api key, couchdb connection info, etc.).
* Go to the "node" folder via the terminal
* Enter `npm install`. 
* When it finishes, type `node twitter-poll.js` to start the script.

The script will ping Twitter every 15 seconds (looking new at-replies) until you stop it.

If you don't want to always have the script running on your local computer, [check out this list of node hosting services](https://github.com/joyent/node/wiki/hosting).


## Deploying the CouchApp

CouchApps are web applications which can be served directly from [CouchDB](http://couchdb.apache.org). This gives them the nice property of replicating just like any other data stored in CouchDB. They are also simple to write as they can use the built-in jQuery libraries and plugins that ship with CouchDB.

[More info about CouchApps here.](http://couchapp.org)

Assuming you just cloned this app from git, and you have changed into the app directory in your terminal, you want to push it to your CouchDB with the CouchApp command line tool ([python version](http://couchapp.org/page/installing)), like this:

    couchapp push . http://name:password@hostname:5984/mydatabase

If you don't have a password on your CouchDB (admin party) you can do it like this (but it's a bad, idea, set a password):

    couchapp push . http://hostname:5984/mydatabase

If you get sick of typing the URL, you should setup a `.couchapprc` file in the root of your directory. Remember not to check this into version control as it will have passwords in it.

The `.couchapprc` file should have contents like this:

    {
      "env" : {
        "public" : {
          "db" : "http://name:pass@mycouch.couchone.com/mydatabase"
        },
        "default" : {
          "db" : "http://name:pass@localhost:5984/mydatabase"
        }
      }
    }

Now that you have the `.couchapprc` file set up, you can push your app to the CouchDB as simply as:

    couchapp push

This pushes to the `default` as specified. To push to the `public` you'd run:

    couchapp push public

Of course you can continue to add more deployment targets as you see fit, and give them whatever names you like.
