/*
 * GET home page.
 */
var FetchFeed = require('../lib/grab').FetchFeed;
var fetchFeed = new FetchFeed(
			'juve', 
			'public/data/feed.xml', 
			{'uri': 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss'}
		);

exports.index = function(req, res)
{
  res.render('index', { user: req.user })
};