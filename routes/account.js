module.exports = function(req, res)
{
  res.render('account', { user: req.user });
};