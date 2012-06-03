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
			self.populate();
			self.addNewGrabControls();
			self.socket_listen();
		},
		socketEmit:function( action, data )
		{
			self.socket.emit(action, data);
		},
		populate:function()
		{
			if( $("#appform").is('div') )
			{
				self.socketEmit('populate', {action:'populate'} );
				self.socket.on('populate', function(data){
					$.each(data, function( key, value){
						self.printBox(value.name, value.url, value.status != 'created' );
						self.updateInputs(value);
						var button = self.printButton(value.name, 'start', 'stop', value.status != 'created' && value.status != 'stopped' );
						$("#"+value.name+"_create_grabber").after(button);
						self.messages(value.name, "Grabber object on "+value.status)
						self.socket.emit('socket_restart', self.fillDataToSend( button ) );
					})
				});
			}
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
		printButton:function( name, action_one, action_two, selected )
		{	
			var sel = ( selected ) ? true : false;
			var $button = $.ninja.button({
				html: ( sel ) ? action_two +' '+name : action_one +' '+name,
				select:sel
			}).select(function () {

				$(this).text(action_two+' '+name);
				self.fillDataToSend( $(this) );
				self.socketEmit( action_one, self.fillDataToSend( $(this) ) );

			}).deselect(function () {
				$(this).text(action_one+' '+name);
				self.socketEmit( action_two, self.fillDataToSend( $(this) ) );
				$(this).removeClass('nui-slc');
				}),
				$buttonSelect = $.ninja.button({
					html: 'Selected',
					select: true
				});
				$button.attr('id', name+'_'+action_one+'_grabber');
				$button.css('display', 'none');
				$button.fadeIn(300, function(){
					
				});
				return $button;
			},
			printBox:function( name, url, selected )
			{
				var container = $('<div class="grabbers_box" id="'+name+'_box"/>')
				, h3 =  $('<h3 class="grabbers_box_title" id="'+name+'_title"/>')
				, buttonDiv = $('<div class="grabber-button" id="'+name+'_button"></div>')
				, messages = $('<div class="messages" id="'+name+'_messages"></div>')
				, span = $('<span class="grabbers_url" />')
				, button
				, sel = ( selected ) ? true : false;
				button = self.printButton( name, 'create', 'destroy', sel );
				self.boxFields( name,  container );
				buttonDiv.append(button);
				h3.text(name);
				span.text(" url: "+url);
				h3.append(span);
				container.append(h3, buttonDiv, messages);
				$("#boxes").append( container );
			},
			updateInputs:function( d )
			{
				var data = d;
				$.each(data, function(key, value){
					if( key != 'message' )
					{
						$("input#"+data.name+"_"+key).val(value);
					}
				});
			},
			socket_listen:function()
			{
				self.socket.on('created', function (data){
					if( data )
					{
						var button = self.printButton(data.name, 'start', 'stop');
						$("#"+data.name+"_create_grabber").after(button);
						self.messages(data.name, data.message);
						self.updateInputs(data);
					}
					
				});
				self.socket.on('started', function (data) 
				{
					if(data)
					{
						self.messages(data.name, data.message);
						self.updateInputs(data);
					}
				});
				self.socket.on('stopped', function (data) {
					if(data)
					{
						self.messages(data.name, data.message);
						self.updateInputs(data);
					}
				});
				
				self.socket.on('news', function (data) {
					self.messages(data.name, data.message);
				});
			},
			messages:function(name, message)
			{
				var p = $('<p class="message" />');
				p.hide();
				p.text(message);
				$("#"+name+"_messages").append(p).fadeIn(200, function(){
					if( $(this).children('p').length > 3 )
					{
						$(this).children('p').eq(1).fadeOut(100, function(){
							console.log( $(this).attr('class'), 'removed')
						});
					}
				});
				p.fadeIn(200);
			},
			boxFields:function(name, container)
			{
				var fields = ['index', 'name', 'url', 'status', 'timestamp', 'file'];
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
					self.printBox(name, url);
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
