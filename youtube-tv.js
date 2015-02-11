var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = "";
YoutubeTV.Playing = [];
YoutubeTV.Lock = false;

YoutubeTV.Video = function(){

	function play( url ){
		YoutubeTV.Current = url;
		var omx = YoutubeTV.OMX;
		omx.getYoutubeUrl( url, function( youtubeUrl){
			console.log('Got youtube url')
			omx.start(youtubeUrl, next);
		});
	}

	function stop(){
		YoutubeTV.OMX.stop();
	}

	function next(){
		console.log("Calling next");
		var sockets = YoutubeTV.Sockets;
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;
		var index = playing.indexOf(current); // -1 is current video is not found

		var first = playing[0];
		var next = playing[index + 1]; //Next or first video if at end of list
		if (next != undefined) {
			play(next); //Play next
			sockets.sendPlay(next);
		} else if(first != undefined) {
			play(first); //Play next
			sockets.sendPlay(first);
		} else {
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

			if(playing.length == 1){
				video.play(data);
				io.sockets.emit('addedVideoAndPlaying', { index: 0, url: url });
			} else {
				io.sockets.emit('addedVideo', { index: playing.length - 1, url: url });
			}
		});

		socket.on("addNext", function( url ){
			var index = playing.indexOf(current);
			playing.splice(index + 1, 0, url);

			if(playing.length == 1){
				video.play(url);
				io.sockets.emit('addedVideoAndPlaying', { index: index + 1, url: url });
			} else {
				io.sockets.emit('addedVideo', { index: index + 1, url: url });
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