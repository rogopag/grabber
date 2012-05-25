/**
 * Module dependencies.
 */

var express = require('express')
  , user = require('./lib/user')
  , routes = require('./routes')
  , login = require('./routes/login')
  , account = require('./routes/account');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'ellington' }));
  app.use(user.passport.initialize());
  app.use(user.passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.use("/data", express.static(__dirname + '/data'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/login', login.login);

app.post('/login', 
  user.passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/account', user.ensureAuthenticated, account);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//go
app.listen( process.env['app_port'] || 3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});