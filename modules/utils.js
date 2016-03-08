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

module.exports = expose;
