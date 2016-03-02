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
	substringAfterLast: substringAfterLast,
	startsWith: startsWith,
	endsWith: endsWith,
	contains: contains,
	millisToHours: millisToHours,
	convertDuration: convertDuration
};

module.exports = expose;
