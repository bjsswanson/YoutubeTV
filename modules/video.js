var fs = require('fs');

function play( item ) {
	var youtube = YoutubeTV.Youtube;
	var iplayer = YoutubeTV.IPlayer;
	var omx = YoutubeTV.OMX;
	var sockets = YoutubeTV.Sockets;

	YoutubeTV.Current = item;
	sockets.emitPlaying(item.id);

	if(item.type == 'youtube') {
		youtube.playYoutube(item.url, next);
	} else if(item.type == 'iplayer'){
		iplayer.playIPlayer(item.id, next);
	} else {
		omx.start(item.url, next);
	}
};

function stop( callback ){
	var omx = YoutubeTV.OMX;
	omx.stop(callback);
};

function next(){
	var scheduler = YoutubeTV.Scheduler;
	var playing = YoutubeTV.Playing;
	var current = YoutubeTV.Current;

	var index = playing.indexOf(current); // -1 is current video is not found
	var first = playing[0];
	var nextVideo = playing[index + 1]; //Next or first video if at end of list

	if(scheduler.isPastStopTime()){
		var millis = scheduler.millisToStart();
		console.log("Past stop time. Stopping. Will resume in: ", scheduler.millisToHours(millis));
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

function loadPlaying(){
	fs.readFile(__dirname + '/../videos.json', function(err, file){
		if(file) {
			YoutubeTV.Playing = JSON.parse(file);
			if (YoutubeTV.Playing.length > 0) {
				play(YoutubeTV.Playing[0]);
			}
		}
	});
}

function savePlaying(){
	fs.writeFile(__dirname + '/../videos.json', JSON.stringify(YoutubeTV.Playing));
}

function removeVideo( id ){
	var playing = YoutubeTV.Playing;
	var sockets = YoutubeTV.Sockets;

	if(id != undefined && id.length > 0) {
		if (isQueued(id)) {
			var index = getIndex(id);
			playing.splice(index, 1);
			savePlaying();
			sockets.emitRemoving(id);
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
	var iPlayer = YoutubeTV.IPlayer;
	var youtube = YoutubeTV.Youtube;
	var local = YoutubeTV.Local;

	if(iPlayer.isIPlayer(url)){
		iPlayer.addIPlayerVideo(url, callback);
	}  else if(youtube.isYoutube(url)){
		youtube.addYoutube(url, callback);
	} else {
		local.addLocalVideo(url, callback );
	}
}

function isFirstVideo(id){
	var playing = YoutubeTV.Playing;
	return playing.length > 0 && playing[0].id === id;
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

function init(){
	loadPlaying();
}

var expose = {
	init: init,
	play: play,
	stop: stop,
	isFirstVideo: isFirstVideo,
	addVideo: addVideo,
	removeVideo: removeVideo,
	savePlaying: savePlaying,
	getIndex: getIndex,
	isQueued: isQueued
};

module.exports = expose;

