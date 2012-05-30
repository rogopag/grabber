jQuery(function($){
	main();
});

function main()
{
	
	var Client = {
		self:null,
		socket:io.connect('http://localhost:3000'),
		init:function()
		{
			self = this;
			self.printStartButton();
			self.socket_listen();
		},
		printStartButton:function()
		{
			var $button = $.ninja.button({
			    html: 'Start Grabbing'
			  }).select(function () {
				 $(this).text('Stop Grabbing');
				 self.socket.emit('start_grabber', { action: 'start' });
			  }).deselect(function () {
				$(this).text('Start Grabbing');
				 self.socket.emit('stop_grabber', { action: 'stop' });
			  }),
			  $buttonSelect = $.ninja.button({
			    html: 'Selected',
			    select: true
			  });

			$("#start-grabber-button").append($button);
		},
		socket_listen:function()
		{
			self.socket.on('news', function (data) {
				var p = $('<p class="message" />')
			    console.log(data);
				p.text(data.message);
				$("#messages").append(p);
			  });
		}
	}
	Client.init();
};
