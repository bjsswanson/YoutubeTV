var child_process = require('child_process');
var fs = require('fs');
var exec = child_process.exec;

function start( file, callback ) {
	if(file) {
		stop(function () {
			var args = ["-o", "hdmi", file]

			subtitles(file, function(subs){
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
		});
	} else {
		console.log("Video not available. Moving on.")
		setTimeout(callback, 1000);
	}
};

function subtitles(file, callback){
	if(file && file.lastIndexOf("/", 0) === 0){
		var fileSubs = file.substr(0, file.lastIndexOf('.')) + ".srt";
		var iPlayerSubs = file.substr(0, file.indexOf('.')) + ".srt";

		fs.stat(fileSubs, function(err, stats){
			if(!err){
				callback(fileSubs);
			} else {
				fs.stat(iPlayerSubs, function(err, stats){
					if(!err){
						callback(iPlayerSubs);
					} else {
						callback();
					}
				})
			}
		})
	} else {
		callback();
	}
};

function stop( callback ) {
	exec('pkill -f omxplayer' , callback);
};

stop(); // Clean up omxplayer on start
expose = {
	start: start,
	stop: stop,
	subtitles: subtitles
}

module.exports = expose;
