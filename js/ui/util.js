Torus.util.empty = function(el) {
	var frag = document.createDocumentFragment();
	while(el.firstChild) {
		frag.appendChild(el.firstChild);
	}
	return frag;
};

Torus.util.create_element = function(opt, parent) {
	if(opt.condition === false) {
		return;
	}
	var el = opt.type ? document.createElement(opt.type) : document.createDocumentFragment(),
		optToProp = {
		'src' 			: 'src',
		'text'			: 'textContent',
		'val'			: 'value',
		'inputtype'		: 'type',
		'href'			: 'href',
		'placeholder'	: 'placeholder'
	}, events = ['click', 'keyup', 'keydown', 'mouseover', 'mouseout', 'blur'];
	for(var o in optToProp) {
		if(optToProp.hasOwnProperty(o) && opt[o] && typeof opt[o] === 'string') {
			el[optToProp[o]] = opt[o];
		}
	}
	if(opt.rows && typeof opt.rows === 'number') {
		el.rows = opt.rows;
	}
	if(opt.checked && typeof opt.checked === 'boolean') {
		el.checked = true;
	}
	events.forEach(function(o) {
		if(opt[o] && typeof opt[o] === 'function') {
			el.addEventListener(o, opt[o]);
		}
	}, this);
	if(opt.style && typeof opt.style === 'object') {
		for(var rule in opt.style) {
			if(opt.style.hasOwnProperty(rule)) {
				el.style[rule] = opt.style[rule];
			}
		}
	}
	if(opt.data && typeof opt.data === 'object') {
		for(var i in opt.data) {
			if(opt.data.hasOwnProperty(i)) {
				el.setAttribute('data-' + i, opt.data[i]);
			}
		}
	}
	if(opt.name && typeof opt.name === 'string') {
		el.name = 'torus-' + opt.name;
	}
	if(opt.for && typeof opt.for === 'string') {
		el.setAttribute('for', 'torus-' + opt.for);
	}
	if(opt.class && typeof opt.class === 'string') {
		el.className = 'torus-' + opt.class;
	} else if(opt.classes) {
		el.className = 'torus-' + opt.classes.join(' torus-');
	}
	if(opt.id && typeof opt.id === 'string') {
		el.id = 'torus-' + opt.id;
		Torus.ui.ids[opt.id] = el;
	}
	if(opt.children && opt.children instanceof Array) {
		opt.children.forEach(function(c) {
			Torus.util.create_element(typeof c === 'string' ? {
				type: 'span',
				text: c
			} : c, el);
		});
	}
	if(parent) {
		parent.appendChild(el);
	} else if(opt.parent && typeof opt.parent === 'string') {
		Torus.ui.ids[opt.parent].appendChild(el);
	} else {
		return el;
	}
};

Torus.util.color_hash = function(str, hue, sat, val) {
	if(typeof str === 'undefined') {
		throw new Error('Not enough parameters. (util.color_hash)');
	}
	str += '';
	hue = hue || 0;
	sat = sat || 0.7;
	val = val || 0.6;
	for(var i = 0; i < str.length; i++) {
		hue = 31 * hue + str.charCodeAt(i);
	} // same hash algorithm as webchat, except this is case sensitive
	hue %= 360;

	// 1 letter variables are fun don't you love mathematicians
	var c = val * sat,
		m = val - c,
		C = Math.floor((c + m) * 255).toString(16),
		X = Math.floor((c * (1 - Math.abs((hue / 60) % 2 - 1)) + m) * 255).toString(16),
		O = Math.floor(m * 255).toString(16);
	if(C.length === 1) {
		C = '0' + C;
	}
	if(X.length === 1) {
		X = '0' + X;
	}
	if(O.length === 1) {
		O = '0' + O;
	}
	switch(Math.floor(hue / 60)) {
		case 0: return '#' + C + X + O;
		case 1: return '#' + X + C + O;
		case 2: return '#' + O + C + X;
		case 3: return '#' + O + X + C;
		case 4: return '#' + X + O + C;
		case 5: return '#' + C + O + X;
	}
};

Torus.util.parse_regex = function(regex) {
	if(!regex) {
		return false;
	}
	var pattern, mode;
	if(regex.charAt(0) === '/') {
		pattern = regex.substring(1, regex.lastIndexOf('/'));
		mode = regex.substring(regex.lastIndexOf('/') + 1);
	} else {
		pattern = regex;
		mode = '';
	}
	try {
		return new RegExp(pattern, mode);
	} catch(err) {
		return false;
	}
};
