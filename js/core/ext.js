Torus.ext = {};

Torus.classes.Extension = function(name, nomenu, version) {
	if(!(this instanceof Torus.classes.Extension)) {
		throw new Error('Must call Torus.classes.Extension with \'new\'.');
	} else if(!name) {
		throw new Error('Extensions must be named.');
	} else if(Torus.ext[name]) {
		throw new Error(`Tried to register new extension '${name}' but it already exists.`);
	}

	Torus.ext[name] = this;

	this.nomenu = nomenu;
	this.name = name;
	this.version = version || Torus.version;
	this.listeners = {
		chat: {},
		ext: {}
	};
	Torus.call_listeners(new Torus.classes.ExtEvent('new', this));
};

Torus.classes.Extension.prototype.add_listener = Torus.add_listener;
Torus.classes.Extension.prototype.remove_listener = Torus.remove_listener;
Torus.classes.Extension.prototype.call_listeners = Torus.call_listeners;
Torus.classes.Extension.prototype.add_onload_listener = Torus.add_onload_listener;
Torus.classes.Extension.prototype.get_version = Torus.get_version;

Torus.classes.ExtEvent = function(event, ext) {
	if(!(this instanceof Torus.classes.ExtEvent)) {
		throw new Error('Must call Torus.classes.ExtEvent with \'new\'.');
	}
	Torus.classes.Event.call(this, 'ext', event, ext);
};
Torus.classes.ExtEvent.prototype = Object.create(Torus.classes.Event.prototype);

Torus.load_ext = (name) => {
	if(Torus.ext[name]) {
		return;
	}
	let dir = `ext/${name}`,
		opt = require(`${__dirname}/${dir}/main.json`),
		data_arr = [];
	new Torus.classes.Extension(name, opt.nomenu, opt.version);
	if(opt.i18n) {
		data_arr.push([`${dir}/i18n`, 'i18n']);
	}
	if(opt.data) {
		data_arr.push([`${dir}/data`, 'files']);
	}
	Torus.load_data(data_arr, () => {
		if(opt.css && opt.css instanceof Array) {
			opt.css.forEach((el) => {
				Torus.util.load_css(`${dir}/css/${el}.css`);
			});
		}
		Torus.util.load_js(`${dir}/js/main.js`);
		if(opt.js && opt.js instanceof Array) {
			opt.js.forEach((el) => {
				Torus.util.load_js(`${dir}/js/${el}.js`);
			});
		}
	});
};
