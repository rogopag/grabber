var FetchFeed = require('../lib/grab').FetchFeed
, db = require('../lib/db');

function SocketListener(app)
{
	var self = this;
	
	self.grabbers = [];

	self.db = db.db;

	self.client = db.client;

	self.client.select(2, function(){

	});

	self.client.on("error", function (err) {
		console.log("Redis error " + err);
	});

	//starts the socket on express server
	self.setSocket( app );

	self.manageMessages();

};
SocketListener.prototype.io = null;

SocketListener.prototype.getGrabber = function(index)
{
	return this.grabbers[index];
};
SocketListener.prototype.setGrabber = function(index, name, file, options)
{
	this.grabbers[index] = new FetchFeed(index, name, file, options);
	return index;
};
SocketListener.prototype.setSocket = function(app)
{
	this.io = require('socket.io').listen(app);
};
SocketListener.prototype.saveTask = function( index, name, url )
{
	var self = this;
	self.client.set( ['task:'+index, JSON.stringify( {'index':index, 'name':name, 'url':url } )], function(err, res){
			console.log( "redis", err, res );
	} );
};
SocketListener.prototype.getTasks = function(socket)
{
	
};
SocketListener.prototype.manageMessages = function()
{
	var self = this;

	self.io.sockets.on('connection', function (socket) {
		
		socket.on('start_grabber', function (data) {
				
		//	console.log( data );
			
			var index = self.setGrabber( self.grabbers.length, 'juve', 
			'public/data/feed.xml', 
			{'uri': 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss'} );
			
			var _id = self.saveTask( index, self.grabbers[index].name, 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss' );
			
			socket.emit('news', { message: 'Grabber program started ' + self.grabbers[index].name, index : index, name:self.grabbers[index].name, url:'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss' } );
			
			self.grabbers[index].fetch();
			
			controls(socket, index);
			
		});
		
		socket.on('error', function(error){
			console.log(error);
		});
	});
	
	var controls = function( socket, index )
	{
		socket.on('stop_grabber', function (data) {
			//console.log( data );
			socket.emit('nonews', { message: 'hello' });
			//console.log( index, self.grabbers, self.grabbers[index] );
			self.grabbers[index].kill_timer();
		});
		
		self.grabbers[index].on('file_written', function(data){
			//console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
		
		self.grabbers[index].on('grabber_stopped', function(data){
			//console.log( "Socket say "+data );
			socket.emit('news', { message: data });
		});
	}
};
module.exports.SocketListener = SocketListener;