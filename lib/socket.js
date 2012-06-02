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
	return this.grabbers[index];
};
SocketListener.prototype.setSocket = function(app)
{
	this.io = require('socket.io').listen(app);
};
SocketListener.prototype.saveTask = function( index, name, url, status, file )
{
	var self = this;
	self.client.rpush( 'tasks', JSON.stringify( {'index':index, 'name':name, 'url':url, 'file':file, 'status':status } ), function(err, res){
			console.log( "redis", err, res );
	} );
};
SocketListener.prototype.getTasks = function(socket)
{	
	var client = this.client;
	
	client.llen('tasks', function(err, len){
		if( len )
		{
			client.lrange('tasks', 0, len, function(err, reply){
				if( err ) {
					console.log("Redis error", err );
					throw err;
				}

				console.log("inside", reply );
				var tmp = [];
				for( var i = 0; i < len; i++)
				{
					tmp.push( JSON.parse(reply[i]) );
				}
				console.log( tmp );
				socket.emit( 'populate', tmp );
			});
		}
	});
};
SocketListener.prototype.taskUpdatePropertyListDb = function( grab, index, property, value )
{
	var client = this.client;
	
	client.lindex('tasks', index, function(err, reply)
	{
		var temp = JSON.parse(reply), fill;
		temp[property] = value;
		fill = JSON.stringify( temp );
		client.lset('tasks', index, fill, function(err, reply){
			console.log( reply );
		})
	});
};
SocketListener.prototype.manageMessages = function()
{
	var self = this;

	self.io.sockets.on('connection', function (socket) {
		
		socket.on('populate', function(data){
			self.getTasks(socket);
		});
		
		socket.on('socket_restart', function(data){
			controls(socket, self.grabbers[data.index]);
		});
		////////////////C R E A T E  E V E N T/////////////////////////////
		socket.on('create', function(data){
			var index = self.grabbers.length;
			var file = 'public/data/'+data.name+'_feed.xml';
			var grab = self.setGrabber( index, data.name, 
			file, 
			{'uri': data.url} );
			
			self.saveTask( index, grab.name, data.url, grab.getStatus(), file );
			
			socket.emit('created', { message: 'Grabber program created ' + grab.name, index : index, name:grab.name, url:data.url, 'status':self.grabbers[index].getStatus(), 'file' : file } );
		});
		
		////////////////S T A R T  E V E N T/////////////////////////////
		socket.on('start', function (data) {
			
			var index = data.index, grab = self.grabbers[index];
			
			grab.fetch();
			
			grab.on('grabber_connected', function(data){
				self.taskUpdatePropertyListDb( grab, index, 'status', grab.getStatus() );
				socket.emit('started', { message: 'Grabber program connected ' + grab.name, index : index, name:grab.name, 'status':grab.getStatus() } );
			});
			
			controls(socket, grab);
		});
		
		socket.on('error', function(error){
			console.log(error);
		});
	});
	
	var controls = function( s, grabber )
	{
		var grab = grabber, socket = s;
		socket.on('stop', function (data) {
			//console.log( data );
			socket.emit('nonews', { message: 'hello' });
			//console.log( index, self.grabbers, self.grabbers[index] );
			grab.kill_timer();
		});
		grab.on('file_written', function(data){
			console.log( "Socket say "+data );
			socket.emit('news', { message: data, name:grab.name });
		});
		
		grab.on('grabber_stopped', function(data){
			console.log( "Socket say "+data );
			self.taskUpdatePropertyListDb( grab, grab.index, 'status', grab.getStatus() );
			socket.emit('stopped', { message: data, name:grab.name, status: grab.getStatus() });
		});
	}
};
module.exports.SocketListener = SocketListener;
// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};