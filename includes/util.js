/**
 * util.js
 *
 * Module for various utility functions used across Torus
 */
class Util {
	/**
	 * Does nothing
	 */
	static null() { }
	/**
	 * Compares two strings
	 * @param {String} str1 First string
	 * @param {String} str2 Second string
	 */
	static compareStrings(str1, str2) {
		for(let i = 0; i < str1.length && i < str2.length; i++) {
	 		if(str1.charAt(i) === str2.charAt(i)) {
	 			continue;
	 		} else {
	 			return str1.charCodeAt(i) - str2.charCodeAt(i);
	 		}
	 	}
		return str1.length - str2.length;
	 }
	 /**
	  * Capitalize the first letter in a string
	  * @param {String} str String to capitalize
	  */
	static cap(str) {
		return str.charAt(0).toUpperCase() + str.substring(1);
	}
	static softmerge(dest, source, prefix) {
		prefix = prefix || '';
		for(var i in source) {
			if(source.hasOwnProperty(i) && !dest[prefix + i]) {
				dest[prefix + i] = source[i];
			}
		}
		return dest;
	}
	static hardmerge(dest, source, prefix) {
		prefix = prefix || '';
		for(var i in source) {
			if(source.hasOwnProperty(i)) {
				dest[prefix + i] = source[i];
			}
		}
	}
	static timestamp(time, timezone, includedate) {
		timezone = timezone || 0;
		const date = new Date();
		if(time) {
			date.setTime(time);
		}
		date.setUTCHours(date.getUTCHours() + timezone);
		let year = date.getFullYear(),
			day = date.getDate(),
			month = date.getMonth(),
			hours = date.getUTCHours(),
			minutes = date.getUTCMinutes(),
			seconds = date.getUTCSeconds();
		if(day < 10) {
			day = '0' + day;
		}
		if(month < 10) {
			month = '0' + month;
		}
		if(hours < 10) {
			hours = '0' + hours;
		}
		if(minutes < 10) {
			minutes = '0' + minutes;
		}
		if(seconds < 10) {
			seconds = '0' + seconds;
		}
		return `${includedate ? `${day}-${month}-${year} ` : ''}${hours}:${minutes}:${seconds}`;
	}
	static expiryToSeconds(expiry) {
		if(!expiry) {
			throw new Error('Not enough parameters. (util.expiry_to_seconds)');
		}
		expiry = expiry.trim();
		if(expiry === 'infinite' || expiry === 'indefinite') {
			return 60 * 60 * 24 * 365 * 1000; // the server recognizes 1000 years as infinite
		} else if(expiry === 'unban' || expiry === 'undo') {
			return 0;
		}
		let ret = 0;
		const split = expiry.split(',');
		for(let i = 0; i < split.length; ++i) {
			const ex = split[i].trim();
			let quant = ex.substring(0, ex.indexOf(' ')),
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
	}
	static secondsToExpiry(seconds) {
		if(!seconds && seconds !== 0) {
			throw new Error('Not enough parameters. (util.seconds_to_expiry)');
		}
		if(seconds === 60 * 60 * 24 * 365 * 1000 || seconds === Infinity) {
			return 'infinite';
		}
		const time = [60 * 60 * 24 * 365 , 60 * 60 * 24 * 30 , 60 * 60 * 24 * 7 , 60 * 60 * 24 , 60 * 60 ,    60    ,     1   ],
			  unit = [     'year'        ,      'month'      ,      'week'      ,    'day'     , 'hour'  , 'minute' , 'second'];
		let str = '';
		for(let i = 0; i < time.length; ++i) { // long division is fun
			const num = Math.floor(seconds / time[i]);
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
	}
	/**
	 * i still cannot believe they thought this was a good idea
	 * ~ Monchoman45
	 */
	static intToStupid(num) {
		let bStupid = '',
			stupid = '';
		// build backwards
		for(; num !== 0; num = Math.floor(num / 10)) {
			bStupid += String.fromCharCode(num % 10);
		}
		// reverse
		for(var i = bStupid.length - 1; i >= 0; --i) {
			stupid += bStupid.charAt(i);
		}
		return stupid;
	}
	static stupidToInt(stupid) {
		let num = 0;
		for(let i = 0; i < stupid.length; ++i) {
			num += stupid.charCodeAt(stupid.length - i - 1) * Math.pow(10, i);
		}
		return num;
	}
	static utf8ify(str) {
		str = encodeURIComponent(str);
		for(let i = str.indexOf('%'); i !== -1; i = str.indexOf('%', i + 1)) {
			str = str.substring(0, i) + String.fromCharCode(parseInt(str.substring(i + 1, i + 3), 16)) + str.substring(i + 3);
		}
		return str;
	}
	static loadCSS(url) {
		const css = document.createElement('link');
		css.className = 'torus-css';
		css.href = url;
		css.rel = 'stylesheet';
		css.type = 'text/css';
		css.media = 'screen';
		document.head.appendChild(css);
		return css;
	}
	/**
	 * Returns a formatted URL string
	 * @param {String} base Base URL to add on to
	 * @param {Object} params URL parameters
	 * @param {Boolean} first If to use & instead of ? as the first parameter separator
	 * @return {String} Formatted URL
	 */
	static formatURL(base, params, first) {
		if(params && typeof params === 'object') {
			first = !first;
			for(var i in params) {
				if(params.hasOwnProperty(i)) {
					base += `${first ? '?' : '&'}${i}=${encodeURIComponent(params[i])}`;
					first = false;
				}
			}
		}
		return base;
	}
	/**
	 * Returns a link to a page on a specified wiki
	 * @param {String} wiki The wiki subdomain to link to
	 * @param {String} page [optional] The page to link to
	 * @param {Object} params [optional] The parameters supplied to the page
	 * @return {String} the url to the page
	 */
	static wikilink(wiki, page, params) {
		if(!wiki) {
			throw new Error('Parameter \'wiki\' is required. (util.wikilink)');
		}
		return Torus.util.format_url(`http://${wiki}.wikia.com/wiki/${page ? encodeURIComponent(page) : ''}`, params);
	}
	/**
	 * Reads a directory and returns the result in a callback
	 * @param {String} dir The directory to read
	 * @return {Promise} The Promise on which to listen for response
	 */
	static readDir(dir) {
		return new Promise(function(resolve, reject) {
			if(typeof dir !== 'string') {
				throw new Error('Parameter \'dir\' not passed or in invalid format (util.read_dir)');
			}
			Torus.fs.readdir(`${__dirname}/${dir}`, Util._fsCallback(resolve, reject));
		});
	}
	/**
	 * Saves a JSON data file into the `data` directory
	 * @param {Object} data Data to save into the file
	 * @param {String} file Name of the file
	 * @return {Promise} The Promise on which to listen for response
	 */
	 static saveData(data, file) {
		 return new Promise(function(resolve, reject) {
			 if(data) { // we do not want to save `null` or `undefined` to a file
		 		Torus.fs.writeFile(`${__dirname}/data/${file}.json`, JSON.stringify(data), Util._fsCallback(resolve, reject));
		 	} else {
				reject(new Error(`Attempted to save empty data to ${file}.json. (Util.saveData)`));
		 	}
		 });
	 }
	 /**
	  * Creates a directory (tolerating if the directory already exists)
	  * @param {String} dir Directory to create
	  * @return {Promise} The Promise on which to listen for response
	  */
	 mkdir(dir) {
		 return new Promise(function(resolve, reject) {
			 Torus.fs.mkdir(`${__dirname}/${dir}`, Util._fsCallback(resolve, reject));
		 });
	 }
	 /**
	  * Shortcut function used to generate a callback function
	  * which rejects a promise if there's an error in FS
	  * and resolves it otherwise
	  * @method _fsCallback
	  * @private
	  * @param {Function} resolve The function to call on resolving
	  * @param {Function} reject The function to call on rejecting
	  * @return {Function} The generated function
	  */
	 static _fsCallback(resolve, reject) {
		 return function(e, d) {
			 if(e /* kill me */ && e.code !== 'EEXIST') {
				 reject(e);
			 } else {
				 resolve(d);
			 }
		 };
	 }
}

module.exports = Util;
