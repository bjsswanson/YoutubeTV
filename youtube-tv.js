var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = "";
YoutubeTV.Playing = [];
YoutubeTV.Lock = false;

YoutubeTV.Video = function(){

	function play( url ){
		YoutubeTV.Current = url;
		var omx = YoutubeTV.OMX;
		omx.getYoutubeUrl( url, function( youtubeUrl){
			omx.start(youtubeUrl, next());
		});
	}

	function stop(){
		YoutubeTV.OMX.stop();
	}

	function next(){
		var sockets = YoutubeTV.Sockets;
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;
		var index = playing.indexOf(current); // -1 is next video is not found

		var next = playing[index + 1]; //Next or first video if at end of list
		if (next != undefined) {
			play(next); //Play next
			sockets.sendPlay(next);
		}  else {
			stop(); //No videos
			sockets.sendStop()
		}
	}

	var expose = {
		play: play,
		stop: stop
	};

	return expose;
}();

YoutubeTV.Sockets = function(){

	function sendPlay( url ){
		var io = YoutubeTV.IO;
		io.sockets.emit('playing', url);
	}

	function sendStop(){
		var io = YoutubeTV.IO;
		io.sockets.emit('stop');
	}

	function sockets(){
		var io = YoutubeTV.IO;
		var video = YoutubeTV.Video;
		io.sockets.on("connection", function( socket ){
			bindEvents( io, socket );
		});
	};

	function bindEvents( io, socket ){
		var video = YoutubeTV.Video;
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;

		socket.on("addLast", function( url ){
			playing.push(url);
			io.sockets.emit('addedVideo', url);
			if(playing.length == 1){
				video.play(data);
			}
			io.sockets.emit('addedVideoAndPlaying', { index: playing.length, url: url });
		});

		socket.on("addNext", function( url ){
			var index = playing.indexOf(current);
			playing.splice(index + 1, 0, url);
			io.sockets.emit('addedVideo', { index: index + 1, url: url });

			if(playing.length == 1){
				video.play(url);
			}
		});

		socket.on("addNextAndPlay", function( url ){
			var index = playing.indexOf(current);
			playing.splice(index + 1, 0, url);
			video.play(url);
			io.sockets.emit('addedVideoAndPlaying',  { index: index + 1, url: url });
		});

		socket.on("savePlaylist", function( data ){

		})

		socket.on("loadPlaylist", function( data ){

		});

		socket.on("saveToPlaylist", function( data ){

		});
	};

	var expose = {
		init: function() {
			sockets();
		},
		sendPlay: sendPlay,
		sendStop: sendStop
	};

	return expose;
}();

module.exports = YoutubeTV;