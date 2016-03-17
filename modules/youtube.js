var config = require('../config');

var URLHelper = require('url');
var QSHelper = require('qs');
var child_process = require('child_process');

var google = require('googleapis');
google.options({ auth: config.googleApiKey });

var api = google.youtube('v3');

function playYoutube(url, callback){
	var omx = YoutubeTV.OMX;
	getYoutubeUrl(url, function (url) {
		omx.start(url, callback);
	});
}

function isYoutube(url){
	var utils = YoutubeTV.Utils;
	return utils.contains(url, "youtube");
}

function addYoutube(url, callback){
	var youtubePlaylist = playlistId(url);
	var youtubeVideo = videoId(url);
	var youtubeChannel = channelId(url);
	if(youtubePlaylist){
		createYoutubePlaylist(youtubePlaylist, callback);
	} else if(youtubeVideo) {
		createYoutubeVideo(youtubeVideo, callback);
	} else if(youtubeChannel){
		createYoutubeChannel(youtubeChannel, callback);
	}
}

function videoId(url ){
	var url_parts = URLHelper.parse(url, true);
	var query = url_parts.query;
	var query_parts = QSHelper.parse(query);
	return query_parts['v'];
}

function playlistId(url ){
	var url_parts = URLHelper.parse(url, true);
	var query = url_parts.query;
	var query_parts = QSHelper.parse(query);
	return query_parts['list'];
}

function channelId( url ){
	var utils = YoutubeTV.Utils;
	var channel =  utils.contains(url, "channel");
	if(channel) {
		return utils.substringAfterLast(url, "channel/");
	}
}

function createYoutubeVideo( videoId, callback ){
	var scheduler = YoutubeTV.Scheduler;
	if(videoId != undefined){
		api.videos.list({
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
					duration: scheduler.convertDuration(item.contentDetails.duration)
				}]);
			}
		});
	}
};

function createYoutubePlaylist( playlistId, callback ){
	if(playlistId != undefined){
		api.playlistItems.list({
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

function createYoutubeChannel( channelId, callback ){
	if(channelId != undefined){
		api.channels.list({
			id: channelId,
			part: 'contentDetails',
			maxResults:  50
		}, function(err, data, res){
			if(data != undefined && data.items.length > 0){
				var playlistId = data.items[0].contentDetails.relatedPlaylists.uploads;
				if(playlistId){
					createYoutubePlaylist(playlistId, callback);
				}
			}
		});
	}
};

function getYoutubeUrl(video, callback) {
	var yt = child_process.spawn("youtube-dl", ["-f", "38/37/46/22/35/34/18/6/5/17/13", "-g", video]);
	var url = "";
	yt.stdout.on('data', function (data) {
		url += data.toString('utf8');
	});
	yt.stdout.on('close', function () {
		yt.kill();
		var realUrl = decodeURI(url).trim();
		callback(realUrl);
	});
}

expose = {
	playYoutube: playYoutube,
	isYoutube: isYoutube,
	addYoutube: addYoutube,
	getYoutubeUrl: getYoutubeUrl
}

module.exports = expose;