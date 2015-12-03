var startDay = 1;
var endDay = 5
var startHour = 7;
var startMinute = 0;
var endHour = 16;
var endMinute = 30;

var URLHelper = require('url');
var QSHelper = require('qs');
var fs = require('fs');

var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];

YoutubeTV.Video = function(){
	function play( item ) {
		var omx = YoutubeTV.OMX;
		YoutubeTV.Current = item;
		emitPlaying(item);
        if(item.type == 'youtube') {
            omx.getYoutubeUrl(item.url, function (youtubeUrl) {
                omx.start(youtubeUrl, next);
            });
        } else {
            omx.start(item.url, next);
        }
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
			var millis = millisToStart();
			console.log("Past stop time. Stopping. Will resume in: ", millisToHours(millis));
			stop(function(){
				setTimeout(function(){
					console.log("Past start time. Resuming.");
					next();
				}, millis);
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
					if(!isQueued(video.id)) {
						playing.push(video);
						emitAdding(playing.length - 1, video);
					}
				});
			});
		});

		socket.on("addNext", function( url ){
			addVideo(url, function (videos) {
				var current = YoutubeTV.Current;
				var index = playing.indexOf(current);
				videos.forEach(function(video) {
					if (!isQueued(video.id)) {
						playing.splice(index + 1, 0, video);
						emitAdding(index + 1, video);
						index++;
					}
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

	function addVideo( url, callback ){
		var playlistId = getPlaylistId(url);
		var videoId = getVideoId(url);
		if(playlistId){
			createPlaylist(playlistId, callback);
		} else if(videoId) {
			createVideo(videoId, callback);
		} else {
            createLocalVideo(url, callback );
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
                        type: 'youtube',
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
                            type: 'youtube',
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

    function createLocalVideo( url, callback ){
        if(url != undefined){
            var n = url.lastIndexOf('/');
            var title = url.substring(n + 1);

            callback([{
                type: 'local',
                url: url,
                id: title,
                title: title,
                image: ''
            }]);
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
		var current_hour = date.getHours();
		var current_minute = date.getMinutes();
		var before_time = current_hour < startHour || (current_hour == startHour && current_minute < startMinute);
		var after_time = current_hour > endHour || (current_hour == endHour && current_minute > endMinute);
		return before_time || after_time;
	}

	function millisToStart(){
		var now = new Date();
		var startTime = new Date();
		var startDay = now.getDay() == endDay ? (7 - endDay + startDay) % 7 : 1; //If today is the last day - days till start (including start day) else tomorrow (1)
		startTime.setDate(startTime.getDate() + startDay);
		startTime.setHours(startHour);
		startTime.setMinutes(startMinute);
		return startTime.getTime() - now.getTime();
	}

	function millisToHours(ms) {
		hours = Math.floor(ms / 3600000), // 1 Hour = 36000 Milliseconds
		minutes = Math.floor((ms % 3600000) / 60000), // 1 Minutes = 60000 Milliseconds
		seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
		return hours + ":" + minutes + ":" + seconds;
	}

	var expose = {
		init: function() {
			initSockets();
		}
	};

	return expose;
}();


YoutubeTV.Local = function() {
    var walk = function(dir) {
        var results = []
        var list = fs.readdirSync(dir)
        list.forEach(function(file) {
            if (!startsWith(file, ".")) {
                file = dir + '/' + file
                var stat = fs.statSync(file)
                if (stat && stat.isDirectory()) {
                    results = results.concat(walk(file))
                } else {
                    results.push(file);
                }
            }
        });
        return results
    }

    function startsWith(str, prefix){
        return str.lastIndexOf(prefix, 0) === 0
    }

    var expose = {
        readFiles: function( path ){
            return walk(path);
        }
    };

    return expose;
}();

module.exports = YoutubeTV;