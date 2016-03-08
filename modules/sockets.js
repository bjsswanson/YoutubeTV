function emitPlaying( id ){
	var io = YoutubeTV.IO;
	io.sockets.emit('playing', id);
}

function emitRemoving( id ){
	var io = YoutubeTV.IO;
	io.sockets.emit('removingVideo', id);
}

function emitAdding( index, vid ) {
	var video = YoutubeTV.Video;
	var io = YoutubeTV.IO;
	if (video.isFirstVideo( vid.id )) {
		video.play(vid);
		io.sockets.emit('addedVideoAndPlaying', { index: index, video: vid });
	} else {
		io.sockets.emit('addedVideo', { index: index, video: vid });
	}
};

function initSockets(){
	var io = YoutubeTV.IO;
	io.sockets.on("connection", function( socket ){
		bindEvents( io, socket );
	});
};

function bindEvents( io, socket ){
	var video = YoutubeTV.Video;
	var local = YoutubeTV.Local;
	var iplayer = YoutubeTV.IPlayer;
	var playing = YoutubeTV.Playing;

	socket.on("addLast", function( url ) {
		video.addVideo(url, function (vids) {
			vids.forEach(function(vid){
				if(!video.isQueued(vid.id)) {
					playing.push(vid);
					video.savePlaying();
					iplayer.downloadIPlayer(vid);
					emitAdding(playing.length - 1, vid);
				}
			});
		});
	});

	socket.on("addNext", function( url ){
		video.addVideo(url, function (vids) {
			var current = YoutubeTV.Current;
			var index = playing.indexOf(current);
			vids.forEach(function(vid) {
				if (!video.isQueued(vid.id)) {
					playing.splice(index + 1, 0, vid);
					video.savePlaying();
					iplayer.downloadIPlayer(vid);
					emitAdding(index + 1, vid);
					index++;
				}
			});
		});
	});

	socket.on("play", function( id ){
		if(video.isQueued(id)){
			var index = video.getIndex(id);
			var vid = playing[index];
			video.play(vid);
		}
	});

	socket.on("playCurrent", function(){
		var current = YoutubeTV.Current;
		if(current){
			video.play(current);
			io.sockets.emit('playing', current.id);
		}
	});

	socket.on("stopCurrent", function(){
		video.stop();
		io.sockets.emit('stop');
	})

	socket.on("removeVideo", function( id ){
		video.removeVideo(id);
	});

	socket.on("removeAll", function(){
		YoutubeTV.Playing.length = 0;
		video.savePlaying();
		video.stop(function(){
			io.sockets.emit('removingAll');
		});
	});

	socket.on("deleteLocal", function(id){
		local.deleteLocal(id);
		video.removeVideo(io, id);
		io.sockets.emit("deleteLocal", id);
	});
};

function init(server){
	YoutubeTV.IO = require('socket.io').listen(server);
	initSockets();
}

var expose = {
	init: init,
	emitPlaying: emitPlaying,
	emitRemoving: emitRemoving
}


module.exports = expose;