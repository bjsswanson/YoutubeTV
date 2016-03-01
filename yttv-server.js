var startDay = 1;
var endDay = 5
var startHour = 7;
var startMinute = 0;
var endHour = 17;
var endMinute = 30;

var URLHelper = require('url');
var QSHelper = require('qs');
var fs = require('fs');
var diskspace = require('diskspace');

var YoutubeTV = YoutubeTV || {};

YoutubeTV.Current = {};
YoutubeTV.Playing = [];

YoutubeTV.Video = function(){

    function loadPlaying(){
        try {
            var file = fs.readFileSync(__dirname + '/videos.json').toString();
            YoutubeTV.Playing = JSON.parse(file);
            if(YoutubeTV.Playing.length > 0) {
                play(YoutubeTV.Playing[0]);
            }
        } catch (err){
            console.log("No videos to load");
        }
    }

    function savePlaying(){
        fs.writeFile(__dirname + '/videos.json', JSON.stringify(YoutubeTV.Playing));
    }

	function play( item ) {
		var omx = YoutubeTV.OMX;
		YoutubeTV.Current = item;
		emitPlaying(item);
        if(item.type == 'youtube') {
            omx.getYoutubeUrl(item.url, function (youtubeUrl) {
                omx.start(youtubeUrl, next);
            });
        } else if(item.type == 'iplayer'){
			omx.streamIPlayer(item.id, next);
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
                        savePlaying();
						downloadIPlayer(video);
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
                        savePlaying();
						downloadIPlayer(video);
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
			removeVideo(io, id);
		});

		socket.on("removeAll", function(){
			YoutubeTV.Playing.length = 0;
            savePlaying();
			stop(function(){
				io.sockets.emit('removingAll');
			});
		});

		socket.on("deleteLocal", function( id ){
			var omx = YoutubeTV.OMX;
			var subtitles = omx.subtitles(id);

			if(id) {
				fs.exists(id, function (exists) {
					if (exists) {
						fs.unlinkSync(id);
					}
				});
			}

			if(subtitles) {
				fs.exists(subtitles, function (exists) {
					if (exists) {
						fs.unlinkSync(subtitles);
					}
				});
			}

			removeVideo(io, id);
			io.sockets.emit("deleteLocal", id);
		});
	};

	function downloadIPlayer(video){
		var omx = YoutubeTV.OMX;
		if(video.type === 'iplayer'){
			omx.downloadIPlayer(video.url, video.id);
		}
	}

	function removeVideo( io, id ){
		if(id != undefined && id.length > 0) {
			if (isQueued(id)) {
				var index = getIndex(id);
				YoutubeTV.Playing.splice(index, 1);
				savePlaying();
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
	}

	function addVideo( url, callback ){
		var playlistId = getPlaylistId(url);
		var videoId = getVideoId(url);
		if(isIPlayer(url)){
			createIPlayerVideo(url, callback)
		} else if(playlistId){
			createYoutubePlaylist(playlistId, callback);
		} else if(videoId) {
			createYoutubeVideo(videoId, callback);
		} else {
            createLocalVideo(url, callback );
        }
	}
	function createIPlayerVideo( url, callback ){
		if(url != undefined){
			var idAndTitle = YoutubeTV.Utils.substringAfterLast(url, "episode/");
			var split = idAndTitle.split("/");

			var id = split.length > 0 ? split[0] : url;
			var title = split.length > 1 ? split[1] : url;

			callback([{
				type: 'iplayer',
				url: url,
				id: id,
				title: title,
				image: { url : "/images/iPlayer.png" }
			}]);

		}
	};



	function createYoutubeVideo( videoId, callback ){
		if(videoId != undefined){
			YoutubeTV.Youtube.videos.list({
				id: videoId,
				part: 'snippet,contentDetails'
			}, function(err, data, res){
				if(data != undefined && data.items.length > 0){
					var item = data.items[0];
                    callback([{
                        type: 'youtube',
                        url: 'https://www.youtube.com/watch?v=' + item.id,
						id: item.id,
						title: item.snippet.title,
						image: item.snippet.thumbnails.default,
                        duration: convertDuration(item.contentDetails.duration)
					}]);
				}
			});
		}
	};

	function createYoutubePlaylist( playlistId, callback ){
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
							image: item.snippet.thumbnails != undefined ? item.snippet.thumbnails.default : { url : ""},
						})
					});

					callback(videos);
				}
			});
		}
	};

    function createLocalVideo( url, callback ){
        if(url != undefined && url.length > 0){
            fs.exists(url, function(exists) {
                if (exists) {
                    var n = url.lastIndexOf('/');
                    var title = url.substring(n + 1);
                    var id = title.replace(/\W/g, '');

                    callback([{
                        type: 'local',
                        url: url,
                        id: id,
                        title: title,
                        image: ''
                    }]);
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

	function isIPlayer(url){
		return url.indexOf("http://www.bbc.co.uk/iplayer") > -1;
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

    function convertDuration(duration) {
        if(duration) {
            var a = duration.match(/\d+/g);

            if (duration.indexOf('M') >= 0 && duration.indexOf('H') == -1 && duration.indexOf('S') == -1) {
                a = [0, a[0], 0];
            }

            if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1) {
                a = [a[0], 0, a[1]];
            }
            if (duration.indexOf('H') >= 0 && duration.indexOf('M') == -1 && duration.indexOf('S') == -1) {
                a = [a[0], 0, 0];
            }

            duration = 0;

            if (a.length == 3) {
                duration = duration + parseInt(a[0]) * 3600;
                duration = duration + parseInt(a[1]) * 60;
                duration = duration + parseInt(a[2]);
            }

            if (a.length == 2) {
                duration = duration + parseInt(a[0]) * 60;
                duration = duration + parseInt(a[1]);
            }

            if (a.length == 1) {
                duration = duration + parseInt(a[0]);
            }
            var h = Math.floor(duration / 3600);
            var m = Math.floor(duration % 3600 / 60);
            var s = Math.floor(duration % 3600 % 60);
            return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
        } else {
            return "Unknown";
        }
    }

	var expose = {
		init: function() {
            loadPlaying();
			initSockets();
		}
	};

	return expose;
}();


YoutubeTV.Local = function() {
    var readFiles = function(dir) {
        var results = [];
        try {
            var list = fs.readdirSync(dir)
            list.forEach(function(file) {
                if (showFile(file)) {
                    file = dir + '/' + file
                    var stat = fs.statSync(file)
                    if (stat && stat.isDirectory()) {
                        results = results.concat(readFiles(file))
                    } else {
                        results.push({"name": YoutubeTV.Utils.substringAfterLast(file, "/"), "path" : file});
                    }
                }
            });
        } catch (err) {
            console.log(err)
        }

        return results
    }

	function showFile(file){
		return !YoutubeTV.Utils.startsWith(file, ".")
			&& !YoutubeTV.Utils.endsWith(file, "srt")
	}

	function freeSpace( path ) {
		diskspace.check(path, function (err, total, free, status) {
			var formattedSpace = humanReadableByteCount(free, false);
			console.log(path, " : ", formattedSpace, " : ", status);
			YoutubeTV.FreeSpace = formattedSpace;
		});
	}

	function humanReadableByteCount(bytes, si) {
		var unit = si ? 1000 : 1024;
		if (bytes < unit) return bytes + " B";
		var exp = parseInt(Math.log(bytes) / Math.log(unit));
		var pre = (si ? "kMGTPE" : "KMGTPE").charAt(exp-1) + (si ? "" : "i");
		var b = bytes / Math.pow(unit, exp)
		return Math.round(b) + " " + pre + "B"
	}

    var expose = {
        readFiles: readFiles,
		freeSpace: freeSpace
    };

    return expose;
}();

YoutubeTV.Utils = function() {
	function substringAfterLast(str, delim){
		if(str.indexOf(delim) != -1) {
			return str.substring(str.lastIndexOf(delim) + delim.length);
		} else {
			return str;
		}
	}

	function startsWith(str, prefix){
		return str.lastIndexOf(prefix, 0) === 0
	}

	function endsWith(str, suffix){
		return str.indexOf(suffix, str.length - suffix.length) !== -1;
	}

	function contains(str, find){
		return str.indexOf(find) !== -1;
	}

	var expose = {
		substringAfterLast: substringAfterLast,
		startsWith: startsWith,
		endsWith: endsWith,
		contains: contains
	};

	return expose;
}();

module.exports = YoutubeTV;