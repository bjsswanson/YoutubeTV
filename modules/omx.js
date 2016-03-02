var child_process = require('child_process');
var fs = require('fs');
var exec = child_process.exec;

function start( file, callback ) {
	if(file) {
		stop(function () {
			var args = ["-o", "hdmi", file]

			var subs = subtitles(file);
			if (subs) {
				args.push("--subtitles");
				args.push(subs);
			}

			var cmd = child_process.spawn("omxplayer", args);
			console.log("Playing:", file.substr(0, 80));
			cmd.on('exit', function (code, signal) {
				cmd.kill();
				if (code == 0 && callback) {
					callback();
				}
			});
		});
	} else {
		console.log("Video not available. Moving on.")
		setTimeout(callback, 1000);
	}
};

function subtitles( file ){
	if(file && file.lastIndexOf("/", 0) === 0){
		var path = file.substr(0, file.lastIndexOf('.')) + ".srt";
		var path2 = file.substr(0, file.indexOf('.')) + ".srt";
		var exists = fs.existsSync(path);
		var exists2 = fs.existsSync(path2);
		if(exists){ return path; }
		if(exists2){ return path2; }
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

function stop( callback ) {
	exec('pkill -f omxplayer' , callback);
};

stop(); // Clean up omxplayer on start
expose = {
	start: start,
	stop: stop,
	subtitles: subtitles,
	getYoutubeUrl: getYoutubeUrl
}

module.exports = expose;
