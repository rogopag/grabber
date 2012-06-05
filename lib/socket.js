var FetchFeed = require('../lib/grab').FetchFeed
, db = require('../lib/db');

function SocketListener(app)
{
	var self = this;
	
	self.grabbers = [];

	self.db = db.db;

	self.client = db.client;
	
	// do not use default redis db 0 use 2 instead
	self.client.select(2, function(){

	});
	
	//if there is a problem with redis please notify and stop execution
	self.client.on("error", function (err) {
		console.log("Redis error " + err);
		throw err;
	});

	//starts the socket on express server
	self.setSocket( app );

	self.manageMessages();

};
SocketListener.prototype.getSocket = function()
{
	return this.io;
};
SocketListener.prototype.getGrabber = function(index)
{
	return this.grabbers[index];
};
SocketListener.prototype.grabbersNum = function()
{
	return this.grabbers.length;
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
/////L O A D  F E E D S  T O  D B /////////////
SocketListener.prototype.saveTask = function( index, name, url, status, file )
{
	var self = this;
	self.client.rpush( 'tasks', JSON.stringify( {'index':index, 'name':name, 'url':url, 'file':file, 'status':status } ), function(err, res){
			console.log( "redis", err, res );
	} );
};
/////R E L O A D  F E E D S  F R O M  D B /////////////
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

				//console.log("inside", reply );
				var tmp = [];
				for( var i = 0; i < len; i++)
				{
					tmp.push( JSON.parse(reply[i]) );
				}
				//console.log( tmp );
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
	var self = this, current_socket;

	self.getSocket().sockets.on('connection', function (socket) {
		
		//rember who's the socket to use outside main connection callback
		current_socket = socket;
		
		/// P O P U L A T E  Front End  O N  P A G E  L O A D //////////////////
		socket.on('populate', function(data){
			self.getTasks(socket);
		});
		
		////////////////G E T  R E S T A R T N O T I F I C A T I O N  E V E N T/////////////////////////////
		socket.on('socket_restart', function(data){
			//if( data.status == 'connected' )
			//track_timer(socket, self.grabbers[data.index]);
		});
		////////////////C R E A T E  E V E N T/////////////////////////////
		socket.on('create', function(data){
			var index = self.grabbersNum();
			var file = 'public/data/'+data.name+'_feed.xml';
			var grab = self.setGrabber( index, data.name, 
			file, 
			{'uri': data.url} );
			
			self.saveTask( index, grab.name, data.url, grab.getStatus(), file );
			
			socket.emit('created', { message: 'Grabber program created ' + grab.name, index : index, name:grab.name, url:data.url, 'status':self.getGrabber(index).getStatus(), 'file' : file } );
		});
		
		////////////////S T A R T  E V E N T/////////////////////////////
		socket.on('start', function (data) {
			
			var index = data.index, grab = self.getGrabber(index);
			
			grab.fetch();
			
			grab.once('grabber_connected', function(data){
				self.taskUpdatePropertyListDb( grab, index, 'status', grab.getStatus() );
				socket.emit('started', { message: 'Grabber program connected ' + grab.name, index : index, name:grab.name, 'status':grab.getStatus() } );
			});
			
			track_timer(socket, grab);
			
			stop_grabber(socket, grab);
			
		});
		
		///// SET OF PRIVATE CALLBACK FUNCTIONS :::: EVENT HANDLERS /////////
		////////////////S T O P  E V E N T/////////////////////////////
		socket.on('stop', function (data) {
			
			var grab = self.getGrabber(data.index);
			
			console.log("Stop kill_timer for %s data %s", grab.name, data);
			
			grab.kill_timer();
			
		});
		
		////////////////E R R O R  E V E N T/////////////////////////////
		socket.on('error', function(error){
			console.log(error);
		});
	});
	
	////////////////S T O P  E V E N T  H A N D L E R S/////////////////////////////
	var stop_grabber = function( s, grabber )
	{
		var grab = grabber, socket = s;
		grab.on('grabber_stopped', stop_write);
		console.log( "stop_grabber ", grab.name)
	};
	
	var stop_write = function(data, grab){
		console.log( "Socket say line 162 "+data );
		self.taskUpdatePropertyListDb( grab, grab.index, 'status', grab.getStatus() );
		current_socket.emit('stopped', { message: data, name:grab.name, status: grab.getStatus() });
		//remove listeners from stopped grabber
		grab.removeListener('file_written', write_write);
		grab.removeListener('grabber_stopped', stop_write);
	};
	////////////////T R A C K  W R I T I N G  H A N D L E R S/////////////////////////////
	var track_timer = function(s, grabber)
	{
		var grab = grabber, socket = s;
		// catch notification messagge for file written 
		grab.on('file_written', write_write );
	};
	
	var write_write = function(data, grab){
		console.log( "Socket say "+data );
		//notify fe file has been written
		current_socket.emit('news', { message: data, name:grab.name });
	};
};
module.exports.SocketListener = SocketListener;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};