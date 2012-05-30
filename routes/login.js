var passport = require('../lib/user').passport;

module.exports.login = function(req, res)
{
  res.render('login', { user: req.user, message: req.flash('error') });
};

module.exports.authenticate = function(req, res, next)
{
	passport.authenticate('local', function(err, user, info) {
	    if (err) { return next(err) }
	    if (!user) {
	      req.flash('error', info.message);
	      return res.redirect('/login')
	    }
	    req.logIn(user, function(err) {
	      if (err) { return next(err); }
	      return res.redirect('/');
	    });
	  })(req, res, next);
};

module.exports.logout = function(req, res)
{
	  req.logout();
	  res.redirect('/');
};