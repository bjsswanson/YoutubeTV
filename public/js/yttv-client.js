var socket = io.connect();

$.fn.insertIndex = function (item, i) {
	if( i === 0){
		this.prepend(item);
	} else {
		var $target = this.children().eq(i - 1);
		if($target.length > 0) {
			$target.after(item);
		} else {
			this.append(item);
		}
	}

	return this;
};

function buttons(){
	$('#addNext').click( function(e){
			e.preventDefault();
			var link  = $('#youtubeLink').val();
			console.log('Adding next: ', link);
			socket.emit("addNext", link)
		}
	);

	$('#addLast').click( function(e){
			e.preventDefault();
			var link  = $('#youtubeLink').val();
			console.log('Adding last: ', link);
			socket.emit("addLast", link)
		}
	);
}

function sockets(){
	socket.on('addedVideo', function( data ){
		addVideoToList( data );
	});

	socket.on('addedVideoAndPlaying', function( data ){
		addVideoToList( data );
	});
}

function addVideoToList( data ){
	var index = data.index;
	var videos = $('#videos');
	var item = $('<li class="list-group-item">' + data.url + '</li>');
	$('#videos').insertIndex(item, index);
}

$(function(){
	buttons();
	sockets();
})