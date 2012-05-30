module.exports.listen = function(app)
{
	var FetchFeed = require('../lib/grab').FetchFeed;
	var fetchFeed = new FetchFeed(
				'juve', 
				'public/data/feed.xml', 
				{'uri': 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss'}
			);
			
	//starts the socket on express server
	var io = require('socket.io').listen(app);
	
	io.sockets.on('connection', function (socket) {
	  	socket.on('start_grabber', function (data) {
				console.log( data );
				fetchFeed.fetch();
		    	socket.emit('news', { message: 'Grabber program started ' + fetchFeed.name });
		  });
		socket.on('stop_grabber', function (data) {
				console.log( data );
		    	socket.emit('nonews', { message: 'hello' });
				fetchFeed.kill_timer();
		  });
		socket.on(error, function(error){
			console.log(error);
		});
		fetchFeed.on('file_written', function(data){
			console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
		fetchFeed.on('grabber_stopped', function(data){
			console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
	});
}