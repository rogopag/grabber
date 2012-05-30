var FetchFeed = require('../lib/grab').FetchFeed;

function SocketListener(app)
{
	var self = this;
	
	//starts the socket on express server
	self.setSocket( app );
		
	self.setGrabber( 'juve', 
	'public/data/feed.xml', 
	{'uri': 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss'} );
	
	self.manageMessages();
	
};
SocketListener.prototype.io = null;

SocketListener.prototype.grabber = null;

SocketListener.prototype.setGrabber = function( name, path, options )
{
	this.grabber = new FetchFeed(name, path, options);
};
SocketListener.prototype.setSocket = function(app)
{
	this.io = require('socket.io').listen(app);
};
SocketListener.prototype.manageMessages = function()
{
	var self = this;
	
	self.io.sockets.on('connection', function (socket) {
	  	socket.on('start_grabber', function (data) {
				console.log( data );
				self.grabber.fetch();
		    	socket.emit('news', { message: 'Grabber program started ' + self.grabber.name });
		  });
		socket.on('stop_grabber', function (data) {
				console.log( data );
		    	socket.emit('nonews', { message: 'hello' });
				self.grabber.kill_timer();
		  });
		socket.on('error', function(error){
			console.log(error);
		});
		self.grabber.on('file_written', function(data){
			console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
		self.grabber.on('grabber_stopped', function(data){
			console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
	});
};
module.exports.SocketListener = SocketListener;