module.exports.login = function(req, res)
{
  res.render('login', { user: req.user, message: req.flash('error') });
};

