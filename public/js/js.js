jQuery(function($){
	main();
});

function main()
{

	var Client = {
		self:null,
		socket:io.connect('/'),
		init:function()
		{
			self = this;
			self.addNewGrabControls();
			self.socket_listen();
		},
		actionGrabber:function( action, data )
		{
			self.socket.emit(action, data);
		},
		fillDataToSend:function( el )
		{
			
			var element = el, parent = el.parent().parent(), data = {};
			parent.find('input[type="hidden"]').each(function(key, value){
				var action = $(value).attr('name').split("_")[1];
				data[action] = $(value).val();
			});
			return data;
		},
		printButton:function( name, callback, action_one, action_two )
		{	
			var $button = $.ninja.button({
				html: action_one+' '+name 
			}).select(function () {

				$(this).text(action_two+' '+name);
				self.fillDataToSend( $(this));
				//callback( action_one, self.fillDataToSend( $(this) ) );

			}).deselect(function () {
				$(this).text(action_one+' '+name);
				self.fillDataToSend( $(this) );
				//callback( action_two, self.fillDataToSend( $(this) ) );
				}),
				$buttonSelect = $.ninja.button({
					html: 'Selected',
					select: true
				});
				$button.attr('id', name+'_'+action_one+'_grabber');
				return $button;
			},
			printBox:function( name )
			{
				var container = $('<div class="grabbers_box" id="'+name+'_box"/>') 
				, buttonDiv = $('<div class="grabber-button" id="'+name+'_button"></div>')
				, messages = $('<div class="messages" id="'+name+'_messages"></div>')
				, button;
				button = self.printButton( name, self.actionGrabber, 'create', 'destroy' );
				self.boxFields( name,  container );
				buttonDiv.append(button);
				container.append(buttonDiv, messages);
				$("#boxes").append( container );
			},
			socket_listen:function()
			{
				self.socket.on('created', function (data){
					console.log(data);
					self.messages(data.message);
				});
				self.socket.on('news', function (data) {
					self.messages(data.message);
				});
				
			},
			messages:function(message)
			{
				var p = $('<p class="message" />')
				p.text(message);
				$("#messages").append(p);
			},
			boxFields:function(name, container)
			{
				var fields = ['name', 'url', 'status', 'timestamp'];
				$.each(fields, function(key, value){
					var field = $('<input type="hidden" name="'+name+'_'+value+'" value="" id="'+name+'_'+value+'">');
					container.append(field);
				});
			},
			addNewGrabControls:function()
			{
				$("input.new_grab_data").click(function(){
					$(this).val('');
				});
				
				$('#add_feed').click(function(){
					var name = ( $("input#new_grab").val() != '' && $("input#new_grab").val() != 'name' ) ? $("input#new_grab").val() : false
					, url = ( $("input#new_grab_url").val() != '' && $("input#new_grab_url").val() != 'url' ) ? $("input#new_grab_url").val() : false;
			
				if( url && name && !$('#'+name+'_box').is('div') )
				{
					self.printBox(name);
					$('#'+name+'_name').val(name);
					$('#'+name+'_url').val(url);
				}
				else
				{
					alert('please fill in a data and choose unique name');
				}
			});
		}
	}
	Client.init();
};
