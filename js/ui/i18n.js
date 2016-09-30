/**
 * i18n.js
 *
 * Module handling internationalization (i18n) of the project
 */
Torus.i18n = {};

/**
 * Finds the language a person currently uses
 * @return {String} the language in use
 */
Torus.i18n.findLang = () => {
	var lang = ((Torus.user.data || {}).options || {}).language || 'en';
	return lang === 'qqx' || typeof Torus.i18n[lang] === 'object' ? lang : 'en';
};

/**
 * Returns the text in the currently used language
 * @param {String} message Message code
 * @returns {String} text in the respective language, if exists
 */
Torus.i18n.text = (...args) => {
	let message = args[0],
	 	lang = Torus.i18n.findLang();
	args = args.splice(1);
	if(Torus.i18n[lang] && Torus.i18n[lang][message]) {
		message = Torus.i18n[lang][message];
	} else {
		lang = 'qqx';
	}

	if(lang === 'qqx') {
		args.forEach((el, i) => {
			message += ` $${i+1} = ${el}`;
		});
	} else {
		args.forEach((el, i) => {
			for(var ref = message.indexOf(`$${i+1}`); ref !== -1; ref = message.indexOf(`$${i+1}`, ref + 1)) {
				if(message.charAt(ref - 1) === '\\') {
					continue;
				}
				message = message.substring(0, ref) + el + message.substring(ref + ('' + i).length + 1);
			}
			while(message.includes('\\$')) {
				message = message.replace('\\$', '$');
			}
		});
	}
	return message;
};

/**
 * Returns the HTML-formatted message in the currently used language
 * @param {String} message The message code
 * @returns {DocumentFragment} the formatted HTML fragment
 */
Torus.i18n.html = (...args) => {
	let message = args[0],
	 	lang = Torus.i18n.findLang();
	// args = args.splice(1); // TODO
	if(Torus.i18n[lang] && Torus.i18n[lang][message]) {
		message = Torus.i18n[lang][message];
	} else {
		lang = 'qqx';
	}
	var frag = document.createDocumentFragment();
	if(lang === 'qqx') {
		frag.appendChild(document.createTextNode(name));
		args.forEach((el, i) => {
			frag.appendChild(document.createTextNode(` $${i+1} = `));
			frag.appendChild(el);
		});
	} else {
		for(var ref = message.indexOf('$'); ref !== -1; ref = message.indexOf('$')) {
			if(message.charAt(ref - 1) === '\\') {
				// $ is escaped
				// TODO: Never tested this, does it even work?
				frag.appendChild(document.createTextNode('$'));
				message = message.substring(2);
			} else {
				// Append the message
				frag.appendChild(document.createTextNode(message.substring(0, ref)));
				var index = '';
				do {
					var c = message.charAt(ref + index.length + 1);
					index += (c ? c : '.');
				} while(args[Number(index)]);
				index = index.substring(0, index.length - 1) * 1;
				if(isNaN(index)) {
					return document.createTextNode(`I18N ERROR: ${name}`);
				}
				frag.appendChild(args[Number(index)]);
				message = message.substring(ref + ('' + index).length + 1);
			}
		}
		frag.appendChild(document.createTextNode(message));
	}
	return frag;
};
