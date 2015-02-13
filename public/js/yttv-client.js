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
			socket.emit("addNext", link)
		}
	);

	$('#addLast').click( function(e){
			e.preventDefault();
			var link  = $('#youtubeLink').val();
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
		playing ( data.id )
	});

	socket.on('playing', function( id ){
		playing( id )
	});

	socket.on('removingVideo', function( id ){
		remove( id );
	});

	socket.on('removingAll', function(){
		$('#videos li').remove();
	})
}

function playing( id ){
	$('#videos li').removeClass('active');
	$('#' + id).addClass('active');
}

function remove( id ){
	$('#' + id).remove();
}

function addVideoToList( data ){
	var index = data.index;
	var item = $('<li></li>').attr('id', data.video.id).addClass('list-group-item');
	var image = $('<img/>').attr('src', data.video.thumbnails.default);
	var text= $('<span></span>').text(data.video.title);
	item.append(image);
	item.append(text);
	$('#videos').insertIndex(item, index);
}

$(function(){
	buttons();
	sockets();
})