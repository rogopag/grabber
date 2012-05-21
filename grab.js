var  fs = require('fs')
    ,request = require('request')
	,file = 'data/feed.xml'
	,reqObj = {'uri': 'http://pipes.yahoo.com/pipes/pipe.run?_id=74637623e9a48f9491059a63594ee9f4&_render=rss'}
	,xml = require('xml-simple');

function fetch_feed()
{
	var req = exports.req = request(reqObj, function (err, response, body){
		if( err && response.statusCode != 200 ) throw err;
		var remote_time, file_time;
		
		xml.parse(body, function(e, parsed) {
			remote_time = Date.parse( parsed.channel.pubDate )
		 });
		
		xml.parse( fs.readFileSync(file, 'utf-8'), function(e, parsed){
			file_time = Date.parse( parsed.channel.pubDate );
		});
		
		console.log( file_time, remote_time );
		
		if( remote_time > file_time )
		{
			fs.writeFile(file, body, function (err) {
			  if (err) throw err;
			  console.log( "File written at %s", Date.now() );
			});
		}
		//debug
		else
		{
			console.log( "File exists already was written at %s", file_time )
		}
		fetch_timeout = setTimeout(fetch_feed, 60000)
	});
	
	req.end();
};

(function(){
	fetch_feed();
})();

