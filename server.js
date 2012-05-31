/**
 * Module dependencies.
 */

var express = require('express')
  , user = require('./lib/user')
  , routes = require('./routes')
  , login = require('./routes/login')
  , account = require('./routes/account')
  , Socket = require('./lib/socket').SocketListener;

var server = module.exports = express.createServer();

//start the socket server
const socket = new Socket(server);

// Configuration

server.configure(function(){
  server.set('views', __dirname + '/views');
  server.set('view engine', 'ejs');
  server.use(express.bodyParser());
  server.use(express.methodOverride());
  server.use(express.cookieParser());
  server.use(express.session({ secret: 'ellington' }));
  server.use(user.passport.initialize());
  server.use(user.passport.session());
  server.use(server.router);
  server.use(express.static(__dirname + '/public'));
  server.use("/data", express.static(__dirname + '/data'));
});

server.configure('development', function(){
  server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

server.configure('production', function(){
  server.use(express.errorHandler());
});

// Routes
server.get('/', routes.index);
server.get('/login', login.login);
server.post('/login', login.authenticate );
server.get('/logout', login.logout);
server.get('/account', user.ensureAuthenticated, account);


// Helpers
server.helpers({
  renderScriptsAndStylesTags: function (all) {
    if (all != undefined) {
      return all.map(function(script) {
        return script;
      }).join('\n ');
    }
    else {
      return '';
    }
  }
});

server.dynamicHelpers({
  scriptsAndStyles: function(req, res) {
    return [];
  }
});

//go
server.listen( process.env['server_port'] || 3000, function(){
  console.log("Express server listening on port %d in %s mode", server.address().port, server.settings.env);
});