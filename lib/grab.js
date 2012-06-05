var  fs = require('fs')
    ,request = require('request')
	,xml = require('xml-simple')
	,events = require('events')
	,util = require('util');

function FetchFeed( index, name, file, options )
{
	this.count = 1;
	this.index = index;
	this.setRequestObject(options);
	this.setName(name);
	this.setLocalFile(file);
	this.setStatus('created');
};
//FetchFeed.prototype = new events.EventEmitter;

util.inherits(FetchFeed, events.EventEmitter);

FetchFeed.prototype.count_connections = 1;

FetchFeed.prototype.written_at = null;

FetchFeed.prototype.timer_id = null;

FetchFeed.prototype.getIndex = function()
{
	return this.index;
};
FetchFeed.prototype.setIndex = function(index)
{
	this.index = index;
};
FetchFeed.prototype.setStatus = function(status)
{
	this.status = status;
};
FetchFeed.prototype.getStatus = function()
{
	return this.status;
};
FetchFeed.prototype.kill_timer = function()
{	
	if( null != this.timer_id )
	{
		this.count_connections = 1;
		this.setStatus('stopped');
		this.emit( 'grabber_stopped', 'Stop grabbing at ' + Date() + ' last file wtitten at by ' + this.name +' '+this.written_at, this);
		clearTimeout(this.timer_id);
	}
	
};
FetchFeed.prototype.setName = function( name )
{
	this.name = name;
};
FetchFeed.prototype.getName = function()
{
	return this.name;
};
FetchFeed.prototype.setLocalFile = function(path)
{
	this.localFile = path;
};
FetchFeed.prototype.getLocalFile = function()
{
	return this.localFile;
};
FetchFeed.prototype.setRequestObject = function( options )
{
	this.reqObj = options; 
};
FetchFeed.prototype.requestObject = function()
{
	return this.reqObj;
};
FetchFeed.prototype.fetch = function( himself )
{
	var self = ( this.hasOwnProperty('reqObj') ) ? this : himself;
	
	console.log( "called fetch at %s", Date() );
	
	var req = request(self.requestObject(), function (err, response, body){
		
		console.log("connecting... %s", Date() );
		
		if( err && response.statusCode != 200 )
		{
			console.log( "connection problems %s", err );
			self.setStatus('connection_error');
			throw err;
		}
		var remote_time, file_time, rtime_nice, ftime_nice, last_feed = {};
		
		self.emit('grabber_downloaded', 'Grabber downloaded ' + self.written_at, self);
		self.count_connections++;
		
		xml.parse(body, function(e, parsed) {
			console.log("parsing remote file...%s", Date() );
			rtime_nice = parsed.channel.pubDate;
			remote_time = Date.parse( parsed.channel.pubDate );
			last_feed.title = parsed.channel.item[0].title;
			last_feed.link = parsed.channel.item[0].link;
			last_feed.description = parsed.channel.item[0].description;
			console.log( "The title of last feed is %s", last_feed.title );
		 });
		
		
		try
		{
			xml.parse( fs.readFileSync(self.getLocalFile(), 'utf-8'), function(e, parsed){
				if( e )
				{
					console.log("Cannot parse local xml file %s ", e);
				}
				console.log( "parse xml local data...%s", Date() )
				ftime_nice = parsed.channel.pubDate;
				file_time = Date.parse( parsed.channel.pubDate );
			});
		}
		catch(e)
		{
			console.log( e );
		}
		
		console.log( remote_time > file_time, remote_time, file_time );
		if( !file_time || remote_time > file_time )
		{
			console.log( "writing content in local file %s...%s", self.getLocalFile(), Date() );
			
			fs.open(self.getLocalFile(), 'w+', function (err, fd) {
				
				
				fs.write(fd, body, null, 'utf8', function (err, written , buf) {
					
					if (err) throw err;

					try
					{
						self.emit('file_written', 'File written at ' + Date(), self, last_feed );
						self.written_at = Date();
					}
					catch(e)
					{
						self.emit('error', e);
					}
					finally
					{
						fs.closeSync(fd);
					}	
				});
				
			});
		}
		//debug
		else
		{
			console.log( "File exists already was written at %s", self.written_at  )
			self.emit('file_written', 'File exists already was written at ' + self.written_at || ftime_nice, self);
		}
		if( null != self.timer_id ) 
		{
			clearTimeout(self.timer_id);
		}
		self.timer_id = setTimeout( self.fetch, 60000, self );
	});
	
	req.on('end', function(){
		console.log( "on request end" );
		self.setStatus('connected');
		self.emit('grabber_connected', 'Grabber is connected to remote resource...', self);
	});
	
	req.end();
};
module.exports.FetchFeed = FetchFeed;