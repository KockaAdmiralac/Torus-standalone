Torus.util = {};

Torus.util.debug = (...args) => {
	console.log(args);
};
Torus.util.null = () => {};

Torus.util.compare_strings = (str1, str2) => {
	for(var i = 0; i < str1.length && i < str2.length; i++) {
		if(str1.charAt(i) === str2.charAt(i)) {
			continue;
		} else {
			return str1.charCodeAt(i) - str2.charCodeAt(i);
		}
	}
	return str1.length - str2.length;
};

Torus.util.cap = (str) => {
	return str.charAt(0).toUpperCase() + str.substring(1);
};

Torus.util.softmerge = (dest, source, prefix) => {
	prefix = prefix || '';
	for(var i in source) {
		if(source.hasOwnProperty(i) && !dest[prefix + i]) {
			dest[prefix + i] = source[i];
		}
	}
	return dest;
};

Torus.util.hardmerge = (dest, source, prefix) => {
	prefix = prefix || '';
	for(var i in source) {
		if(source.hasOwnProperty(i)) {
			dest[prefix + i] = source[i];
		}
	}
};

Torus.util.timestamp = (time, timezone) => {
	timezone = timezone || 0;
	var date = new Date();
	if(time) {
		date.setTime(time);
	}
	date.setUTCHours(date.getUTCHours() + timezone);
	var hours = date.getUTCHours(),
		minutes = date.getUTCMinutes(),
		seconds = date.getUTCSeconds();
	if(hours < 10) {
		hours = '0' + hours;
	}
	if(minutes < 10) {
		minutes = '0' + minutes;
	}
	if(seconds < 10) {
		seconds = '0' + seconds;
	}
	return hours + ':' + minutes + ':' + seconds;
};

Torus.util.expiry_to_seconds = (expiry) => {
	if(!expiry) {
		throw new Error('Not enough parameters. (util.expiry_to_seconds)');
	}
	expiry = expiry.trim();
	if(expiry === 'infinite' || expiry === 'indefinite') {
		return 60 * 60 * 24 * 365 * 1000; // the server recognizes 1000 years as infinite
	} else if(expiry === 'unban' || expiry === 'undo') {
		return 0;
	}
	var ret = 0;
	var split = expiry.split(',');
	for(var i = 0; i < split.length; i++) {
		var ex = split[i].trim(),
			quant = ex.substring(0, ex.indexOf(' ')),
			unit = ex.substring(ex.indexOf(' ') + 1);

		if(quant === 'a' || quant === 'an') {
			quant = 1;
		} else if(isNaN(quant * 1)) {
			return false;
		}
		if(unit.charAt(unit.length - 1) === 's') {
			unit = unit.substring(0, unit.length - 1);
		}

		switch(unit) {
			case 'second': ret += quant * 1; break;
			case 'minute': ret += quant * 60; break;
			case 'hour': ret += quant * 60 * 60; break;
			case 'day': ret += quant * 60 * 60 * 24; break;
			case 'week': ret += quant * 60 * 60 * 24 * 7; break;
			case 'month': ret += quant * 60 * 60 * 24 * 30; break;
			case 'year': ret += quant * 60 * 60 * 24 * 365; break;
		}
	}
	return ret;
};

Torus.util.seconds_to_expiry = (seconds) => {
	if(!seconds && seconds !== 0) {
		throw new Error('Not enough parameters. (util.seconds_to_expiry)');
	}
	if(seconds === 60 * 60 * 24 * 365 * 1000 || seconds === Infinity) {
		return 'infinite';
	}
	var time = [60 * 60 * 24 * 365 , 60 * 60 * 24 * 30 , 60 * 60 * 24 * 7 , 60 * 60 * 24 , 60 * 60 ,    60    ,     1   ];
	var unit = [     'year'        ,      'month'      ,      'week'      ,    'day'     , 'hour'  , 'minute' , 'second'];

	var str = '';
	for(var i = 0; i < time.length; i++) { // long division is fun
		var num = Math.floor(seconds / time[i]);
		if(num > 0) {
			if(num === 1) {
				str += '1 ' + unit[i] + ', ';
			} else {
				str += num + ' ' + unit[i] + 's, ';
			}
			seconds -= num * time[i];
		}
	}
	return str.substring(0, str.length - 2);
};

Torus.util.int_to_stupid = (num) => { // i still cannot believe they thought this was a good idea
	var b_stupid = ''; // build backwards
	for(num; num !== 0; num = Math.floor(num / 10)) {
		b_stupid += String.fromCharCode(num % 10);
	}
	var stupid = '';
	for(var i = b_stupid.length - 1; i >= 0; i--) {
		stupid += b_stupid.charAt(i);
	} // reverse
	return stupid;
};

Torus.util.stupid_to_int = (stupid) => {
	var num = 0;
	for(var i = 0; i < stupid.length; i++) {
		num += stupid.charCodeAt(stupid.length - i - 1) * Math.pow(10, i);
	}
	return num;
};

Torus.util.utf8ify = (str) => {
	str = encodeURIComponent(str);
	for(var i = str.indexOf('%'); i !== -1; i = str.indexOf('%', i + 1)) {
		str = str.substring(0, i) + String.fromCharCode(parseInt(str.substring(i + 1, i + 3), 16)) + str.substring(i + 3);
	}
	return str;
};

Torus.util.load_js = (url) => {
	var js = document.createElement('script');
		js.className = 'torus-js';
		js.src = url;
		js.type = 'text/javascript';
	document.head.appendChild(js);
	return js;
};

Torus.util.load_css = (url) => {
	var css = document.createElement('link');
		css.className = 'torus-css';
		css.href = url;
		css.rel = 'stylesheet';
		css.type = 'text/css';
		css.media = 'screen';
	document.head.appendChild(css);
	return css;
};

/**
 * Returns a link to a page on a specified wiki
 * @param {String} wiki The wiki subdomain to link to
 * @param {String} page [optional] The page to link to
 * @param {Object} params [optional] The parameters supplied to the page
 * @return {String} the url to the page
 */
Torus.util.wikilink = (wiki, page, params) => {
	if(!wiki) {
		throw new Error('Parameter \'wiki\' is required. (util.wikilink)');
	}
	var uri = 'http://' + wiki + '.wikia.com/wiki/';
	if(page) {
		uri += encodeURIComponent(page);
	}
	if(params && typeof params === 'object') {
		var first = true;
		for(var i in params) {
			if(params.hasOwnProperty(i)) {
				uri += (first ? '?' : '&') + i + '=' + encodeURIComponent(params[i]);
				first = false;
			}
		}
	}
	return uri;
};

/**
 * Reads a directory and returns the result in a callback
 * @param {String} dir The directory to read
 * @param {Function} cb Success callback, passes data in first parameter
 * @param {Function} ecb Error callback, passes error in first parameter
 *                       If not set, throws the error
 */
Torus.util.read_dir = (dir, cb, ecb) => {
	if(typeof dir !== 'string') {
		throw new Error('Parameter \'dir\' not passed or in invalid format (util.read_dir)');
	}
	Torus.fs.readdir(dir, (e, d) => {
		if(e) {
			if(typeof ecb === 'function') {
				ecb.call(Torus, e);
			} else {
				throw e;
			}
		} else {
			if(typeof cb === 'function') {
				cb.call(Torus, d);
			}
		}
	});
};
