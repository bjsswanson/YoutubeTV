var socket = io.connect();

$(function(){
	$('#addNext').click( function(e){
			e.preventDefault();
			var link  = $('#youtubeLink').val();
			console.log('Emitting: ', link);
			socket.emit("addNext", link)
		}
	);
})