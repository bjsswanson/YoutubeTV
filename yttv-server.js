var startDay = 1;
var endDay = 5
var startHour = 8;
var startMinute = 0;
var endHour = 16;
var endMinute = 30;

var URLHelper = require('url');
var QSHelper = require('qs');

var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];

YoutubeTV.Video = function(){
	function play( item ) {
		var omx = YoutubeTV.OMX;
		YoutubeTV.Current = item;
		emitPlaying(item);
		omx.getYoutubeUrl(item.url, function ( youtubeUrl ) {
			omx.start(youtubeUrl, next);
		});
	};

	function stop( callback ){
		emitStopping()
		YoutubeTV.OMX.stop(callback);
	};

	function next(){
		var playing = YoutubeTV.Playing;
		var current = YoutubeTV.Current;
		var index = playing.indexOf(current); // -1 is current video is not found
		var first = playing[0];
		var nextVideo = playing[index + 1]; //Next or first video if at end of list
		if(isPastStopTime()){ //TODO: Add holding image while off
			console.log("Past stop time. Stopping.");
			stop(function(){
				setTimeout(function(){
					console.log("Past start time. Resuming.");
					next();
				}, millisToStart());
			});
		} else if (nextVideo != undefined) {
			play(nextVideo); //Play nextVideo
		} else if(first != undefined) {
			play(first); //Play nextVideo
		} else {
			stop(); //No videos
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

	function emitAdding( index, video ) {
		var io = YoutubeTV.IO;
		if (isFirstVideo( video.id )) {
			play(video);
			io.sockets.emit('addedVideoAndPlaying', { index: index, video: video });
		} else {
			io.sockets.emit('addedVideo', { index: index, video: video });
		}
	};

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
			addVideo(url, function (videos) {
				videos.forEach(function(video){
					playing.push(video);
					emitAdding(playing.length - 1, video);
				});
			});
		});

		socket.on("addNext", function( url ){
			addVideo(url, function (videos) {
				var current = YoutubeTV.Current;
				var index = playing.indexOf(current);
				videos.forEach(function(video) {
					playing.splice(index + 1, 0, video);
					emitAdding(index + 1, video);
					index++;
				});
			});
		});

		socket.on("play", function( id ){
			if(isQueued(id)){
				var index = getIndex(id);
				var video = playing[index];
				play(video);
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
			YoutubeTV.Playing.length = 0;
			stop(function(){
				io.sockets.emit('removingAll');
			});
		});
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
			}
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
					callback([{
						url: 'https://www.youtube.com/watch?v=' + item.id,
						id: item.id,
						title: item.snippet.title,
						image: item.snippet.thumbnails.default
					}]);
				}
			});
		}
	};

	function createPlaylist( playlistId, callback ){
		if(playlistId != undefined){
			YoutubeTV.Youtube.playlistItems.list({
				playlistId: playlistId,
				part: 'snippet',
				maxResults:  50
			}, function(err, data, res){
				if(data != undefined && data.items.length > 0){
					var videos = [];
					data.items.forEach(function(item){
						videos.push({
							url: 'https://www.youtube.com/watch?v=' + item.snippet.resourceId.videoId,
							id: item.snippet.resourceId.videoId,
							title: item.snippet.title,
							image: item.snippet.thumbnails != undefined ? item.snippet.thumbnails.default : { url : ""}
						})
					});

					callback(videos);
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

	function isPastStopTime(){
		var date = new Date();
		var current_day = date.getDay();
		var current_hour = date.getHours();
		var current_minute = date.getMinutes();
		var workday = current_day >= startDay && current_day <= endDay;
		var before_time = current_hour <= startHour && current_minute <= startMinute;
		var after_time = current_hour >= endHour && current_minute >= endMinute;
		return workday && (before_time || after_time) ;
	}


	function millisToStart(){
		var start = new Date();
		var end = new Date();
		var nextDay = start.getDay() >= endDay ? 3 : 1;
		end.setDate(end.getDate() + nextDay);
		end.setHours(startHour);
		end.setMinutes(startMinute);
		return end.getTime() - start.getTime();
	}

	var expose = {
		init: function() {
			initSockets();
		}
	};

	return expose;
}();

module.exports = YoutubeTV;