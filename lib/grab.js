var  fs = require('fs')
    ,request = require('request')
	,xml = require('xml-simple');

function FetchFeed( name, file, options )
{
	this.setRequestObject(options);
	this.setName(name);
	this.setLocalFile(file);
};
FetchFeed.prototype.setName = function( name )
{
	this.name = name;
};
FetchFeed.prototype.name = function()
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
			throw err;
		}
		var remote_time, file_time, rtime_nice, ftime_nice;
		
		xml.parse(body, function(e, parsed) {
			console.log("parsing remote file...%s", Date() );
			rtime_nice = parsed.channel.pubDate;
			remote_time = Date.parse( parsed.channel.pubDate )
		 });
		
		
		xml.parse( fs.readFileSync(self.getLocalFile(), 'utf-8'), function(e, parsed){
			console.log( "parse xml local data...%s", Date() )
			ftime_nice = parsed.channel.pubDate;
			file_time = Date.parse( parsed.channel.pubDate );
		});
		
		if( !file_time || remote_time > file_time )
		{
			console.log( "writing content in local file...%s", Date() );
			
			fs.writeFile(self.getLocalFile(), body, function (err) {
			  if (err) throw err;
			  console.log( "File written at %s", Date() );
			});
		}
		//debug
		else
		{
			console.log( "File exists already was written at %s", Date() )
		}
		fetch_timeout = setTimeout( self.fetch, 60000, self );
	});
	
	req.end();
};

exports.FetchFeed = FetchFeed;
