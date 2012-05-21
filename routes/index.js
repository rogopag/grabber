/*
 * GET home page.
 */
require('../grab');

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};