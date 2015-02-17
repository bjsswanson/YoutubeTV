var URLHelper = require('url');
var QSHelper = require('qs');

var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];

YoutubeTV.Video = function(){
	function play( item ) {
		var omx = YoutubeTV.OMX;
		if (item.type == 'video') {
			YoutubeTV.Current = item;
			omx.getYoutubeUrl(item.url, function ( youtubeUrl ) {
				omx.start(youtubeUrl, next);
			});
		} else if(item.type == 'playlist'){
			if(!item.current){
				YoutubeTV.Current = item;
				item.current = 0;
			}
			var video = item.videos[item.current];
			omx.getYoutubeUrl(video.url, function ( youtubeUrl ) {
				omx.start(youtubeUrl, next);
			});
		}
	};

	function stop( callback ){
		YoutubeTV.OMX.stop(callback);
	};

	function next(){ //Switch to playlist + video logic
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;
		var index = playing.indexOf(current); // -1 is current video is not found
		var first = playing[0];
		var next = playing[index + 1]; //Next or first video if at end of list
		if (next != undefined) {
			play(next); //Play next
			emitPlaying(next);
		} else if(first != undefined) {
			play(first); //Play next
			emitPlaying(first);
		} else {
			stop(); //No videos
			emitStopping()
		}
	};

	function emitPlaying( data ){
		var io = YoutubeTV.IO;
		io.sockets.emit('playing', data.id);
	}

	function emitStopping(){
		var io = YoutubeTV.IO;
		io.sockets.emit('stop');
	}

	function initSockets(){
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
				var index = getIndex(id);
				var video = playing[index];
				stop(function(){
					play(video);
				});
			}
		});

		socket.on("playCurrent", function(){
			var current = YoutubeTV.Current;
			if(current){
				play(current);
			}
		});

		socket.on("stopCurrent", function(){
			stop();
		})

		socket.on("removeVideo", function( id ){
			if(id != undefined && id.length > 0) {
				if (isQueued(id)) {
					var index = getIndex(id);
					YoutubeTV.Playing.splice(index, 1);
					io.sockets.emit('removingVideo', id);
					if(YoutubeTV.Current && YoutubeTV.Current.id == id){
						stop(function(){
							if(YoutubeTV.Playing.length > 0){
								next();
							}
						});
					}
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
			var playlistId = getPlaylistId(url);
			var videoId = getVideoId(url);
			if(playlistId){
				if(!isQueued(playlistId)){
					createPlaylist(playlistId, callback);
				}
			} else if(videoId) {
				if (!isQueued(videoId)) {
					createVideo(videoId, callback);
				} else {
					socket.emit('alreadyExists');
				}
			} else {
				socket.emit('invalidVideo')
			}
		}

		function createVideo( videoId, callback ){
			if(videoId != undefined){
				YoutubeTV.Youtube.videos.list({
					id: videoId,
					part: 'snippet'
				}, function(err, data, res){
					if(data != undefined && data.items.length > 0){
						var item = data.items[0];
						callback({
							type: 'video',
							url: 'https://www.youtube.com/watch?v=' + item.id,
							id: item.id,
							title: item.snippet.title,
							image: item.snippet.thumbnails.default
						});
					} else {
						socket.emit('missingVideo');
					}
				});
			}
		};
	};

	function createPlaylist( playlistId, callback ){
		if(playlistId != undefined){
			YoutubeTV.Youtube.videos.list({
				playlistId: playlistId,
				part: 'snippet',
				maxResults:  50
			}, function(err, data, res){
				if(data != undefined && data.items.length > 0){
					var playlist = {
						type: 'playlist',
						id: playlistId,
						videos:[]
					}

					data.forEach(function(item){
						videos.push({
							url: 'https://www.youtube.com/watch?v=' + item.resourceId.videoId,
							id: item.resourceId.videoId,
							title: item.snippet.title,
							image: item.snippet.thumbnails.default
						})
					});

					callback(playlist);
				} else {
					socket.emit('missingVideo');
				}
			});
		}
	};


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

	function getPlaylistId( url ){
		var url_parts = URLHelper.parse(url, true);
		var query = url_parts.query;
		var query_parts = QSHelper.parse(query);
		return query_parts['list'];
	}

	var expose = {
		init: function() {
			initSockets();
		}
	};

	return expose;
}();

module.exports = YoutubeTV;