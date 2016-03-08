var config = require('../config')

function isPastStopTime(){
	var date = new Date();
	var current_hour = date.getHours();
	var current_minute = date.getMinutes();
	var before_time = current_hour < config.startHour || (current_hour == config.startHour && current_minute < config.startMinute);
	var after_time = current_hour > config.endHour || (current_hour == config.endHour && current_minute > config.endMinute);
	return before_time || after_time;
}

function millisToStart(){
	var now = new Date();
	var startTime = new Date();
	var day = now.getDay() == config.endDay ? (7 - config.endDay + config.startDay) % 7 : 1; //If today is the last day - days till start (including start day) else tomorrow (1)
	startTime.setDate(startTime.getDate() + day);
	startTime.setHours(config.startHour);
	startTime.setMinutes(config.startMinute);
	return startTime.getTime() - now.getTime();
}

function millisToHours(ms) {
	var hours = Math.floor(ms / 3600000) // 1 Hour = 36000 Milliseconds
	var minutes = Math.floor((ms % 3600000) / 60000) // 1 Minutes = 60000 Milliseconds
	var seconds = Math.floor(((ms % 360000) % 60000) / 1000) // 1 Second = 1000 Milliseconds
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
	isPastStopTime: isPastStopTime,
	millisToStart: millisToStart,
	millisToHours: millisToHours,
	convertDuration: convertDuration
}

module.exports = expose;
