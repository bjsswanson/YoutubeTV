var URLHelper = require('url');
var QSHelper = require('qs');

var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];
YoutubeTV.Lock = false;

YoutubeTV.Video = function(){

	function play( video ){
		YoutubeTV.Current = video;
		var omx = YoutubeTV.OMX;
		omx.getYoutubeUrl( video.url, function( youtubeUrl){
			omx.start(youtubeUrl, next);
		});
	};

	function stop( callback ){
		YoutubeTV.OMX.stop( callback );
	};

	function next(){
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;
		var index = playing.indexOf(current); // -1 is current video is not found

		var first = playing[0];
		var next = playing[index + 1]; //Next or first video if at end of list
		if (next != undefined) {
			play(next); //Play next
			sendPlay(next);
		} else if(first != undefined) {
			play(first); //Play next
			sendPlay(first);
		} else {
			stop(); //No videos
			sendStop()
		}
	};

	function sendPlay( data ){
		var io = YoutubeTV.IO;
		io.sockets.emit('playing', data.id);
	}

	function sendStop(){
		var io = YoutubeTV.IO;
		io.sockets.emit('stop');
	}

	function sockets(){
		var io = YoutubeTV.IO;
		io.sockets.on("connection", function( socket ){
			bindEvents( io, socket );
		});
	};

	function bindEvents( io, socket ){
		var playing = YoutubeTV.Playing;

		socket.emit("playing", YoutubeTV.Current.id);

		socket.on("addLast", function( url ) {
			addVideo(url, function (video) {
				playing.push(video);
				emitPlaying(playing.length - 1, video);
			});
		});

		socket.on("addNext", function( url ){
			addVideo(url, function (video) {
				var current = YoutubeTV.Current;
				var index = playing.indexOf(current);
				playing.splice(index + 1, 0, video);
				emitPlaying(index + 1, video);
			});
		});

		socket.on("play", function( id ){
			if(isQueued(id)){
				console.log("Id:", id)
				var index = getIndex(id);
				var video = playing[index];
				console.log("")
				stop(function(){
					play(video);
				});
			}
		});

		socket.on("removeVideo", function( id ){
			if(id != undefined && id.length > 0) {
				if (isQueued(id)) {
					if (id === YoutubeTV.Current.id){
						next();
					}
					var index = getIndex(id);
					YoutubeTV.Playing.splice(index, 1);
					io.sockets.emit('removingVideo', id);
				}
			}
		});

		socket.on("removeAll", function(){
			stop(function(){
				YoutubeTV.Playing.length = 0;
				io.sockets.emit('removingAll');
			});
		});

		function emitPlaying( index, video ) {
			if (isFirstVideo( video.id )) {
				play(video);
				io.sockets.emit('addedVideoAndPlaying', { index: index, video: video });
			} else {
				io.sockets.emit('addedVideo', { index: index, video: video });
			}
		};

		function addVideo(url, callback){
			var id = getVideoId(url);
			if(id) {
				if (!isQueued(id)) {
					createVideo(url, id, callback);
				} else {
					socket.emit('alreadyExists');
				}
			} else {
				socket.emit('invalidVideo')
			}
		}

		function isFirstVideo(id){
			return YoutubeTV.Playing.length > 0 && YoutubeTV.Playing[0].id === id;
		}

		function isQueued( id ){
			return getIndex(id) > -1;
		}

		function getIndex( id ){
			var playing = YoutubeTV.Playing;
			for(var i = 0; i < playing.length; i++){
				var item = playing[i];
				if(item.id == id){
					return i;
				}
			}
			return -1;
		}

		function getVideoId( url ){
			var url_parts = URLHelper.parse(url, true);
			var query = url_parts.query;
			var query_parts = QSHelper.parse(query);
			return query_parts['v'];
		}

		function createVideo( url, videoId, callback ){
			if(videoId != undefined){
				YoutubeTV.Youtube.videos.list({
					id: videoId,
					part: 'snippet'
				}, function(err, data, res){
					if(data != undefined && data.items.length > 0){
						var item = data.items[0];
						callback({
							url: url,
							id: item.id,
							title: item.snippet.title,
							image: item.snippet.thumbnails.default
						});
					} else {
						console.log(err);
						socket.emit('missingVideo');
					}
				});
			}
		};
	};


	var expose = {
		init: function() {
			sockets();
		}
	};

	return expose;
}();

module.exports = YoutubeTV;