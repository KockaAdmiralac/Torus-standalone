/* ========================================================================== */
/*   ___________     ________    ___________     ___     ___     ___________  */
/*  /           \   /   __   \  |   ____    \   |   |   |   |   /           \ */
/*  \___    ____/   |  |  |  |  |  |    |    |  |   |   |   |   |   ________/ */
/*     |    |       |  |  |  |  |  |____| ___|  |   |   |   |   |   |_______  */
/*     |    |       |  |  |  |  |    _    \     |   |   |   |   |           \ */
/*     |    |       |  |  |  |  |    |\    \    |   |   |   |   \_______    | */
/*     |    |       |  |  |  |  |    | \    \   |   |   |   |    _______|   | */
/*     |    |       |  |__|  |  |    |  \    |  |    \_/    |   /           | */
/*     \____/       \________/  |____|   \___|  \___________/   \___________/ */
/* 				A Wikia chat client that isn't Special:Chat                   */
/* -------------------------------------------------------------------------- */
/* Author: Monchoman45     													  */
/* Standalone version by KockaAdmiralac     								  */
/* ========================================================================== */

window.Torus = {
	init: false,
	version: {
		major: 0,
		minor: 1,
		patch: 2
	},
	debug: false, 	// Set this to true if you wanna see some good stuff
					// HINT: Look at the console ;)
	chats: {},
	user: {},
	fs: require('fs'),
	shell: require('electron').shell,
	files: {},
	cache: {},
	loading: {},
	listeners: { // TODO: Remove this because listeners now get added automatically?
		window: {
			load: [],
			unload: [],
		},
		chat: {
			'new': [],

			open: [],
			connected: [],
			close: [],
			reopen: [],

			update_user: [],
			remove_user: [],

			initial: [],
			send_message: [],
			send_me: [],
			setstatus: [],
			logout: [],
			givechatmod: [],
			kick: [],
			ban: [],
			unban: [], // FIXME: never called
			openprivate: [],
		},
		io: {
			initial: [],
			message: [],
			alert: [],
			me: [],
			join: [],
			rejoin: [],
			part: [],
			ghost: [],
			logout: [],
			update_user: [],
			ctcp: [],
			mod: [],
			kick: [],
			ban: [],
			unban: [],
			open_private: [],
			force_reconnect: [],
			force_disconnect: []
		},
		ui: {
			render: [],
			activate: [],
			deactivate: [],
			show: [],
			unshow: [],
			render_popup: [],
			unrender_popup: [],
			ping: []
		},
		ext: {
			'new': []
		}
	},
	io: {
		transports: {},
		jsonp_callbacks: [],
	},
	classes: {},
	util: {},
	data: {
		domains: {},
		ids: {},
		blocked: [],
		blockedBy: [],
		pinginterval: 0,
		history: [],
		histindex: 0,
		tabtext: '',
		tabindex: 0,
		tabpos: 0
	},
	logs: {
		messages: {},
		plain: {},
		socket: {},
	}
};

/**
 * Adds an event listener
 * @param {String} type Event type
 * @param {String} event Event to listen for
 * @param {Function} func Callback
 */
Torus.add_listener = function(type, event, func) {
	this.listeners[type] = this.listeners[type] || {};
	this.listeners[type][event] = this.listeners[type][event] || [];
	this.listeners[type][event].push(func);
	return true;
};

/**
 * Adds a listener for window load
 * Fires immediately if window is loaded
 * @param {Function} func Callback
 */
Torus.add_onload_listener = (func) => {
	if(document.readyState === 'complete') {
		func.call(Torus);
	} else {
		this.add_listener('window', 'load', func);
	}
};

/**
 * Function for removing an event listener
 * Accepts the event name and the listener function
 * Returns true if the listener is removed, otherwise false
 */
Torus.remove_listener = function(type, event, func) {
	if(!this.listeners[type]) {
		throw new Error(`Event type '${type}' doesn't exist`);
	}
	if(!this.listeners[type][event]) {
		return false;
	}
	for(var i = 0; i < this.listeners[type][event].length; ++i) {
		if(this.listeners[type][event][i] === func) {
			this.listeners[type][event].splice(i, 1);
			return true;
		}
	}
	return false;
};

/**
 * Function for calling listeners for an event
 * @param {String} event Event name
 * @return {Boolean} If type is valid
 */
Torus.call_listeners = function(event) {
	if(!event.type || !event.event) {
		throw new Error(`Event has no 'type' or 'event' property: ${JSON.stringify(event)}`);
	} else if(!this.listeners[event.type]) {
		throw new Error(`Event type '${event.type}' doesn't exist`);
	}

	if(this.listeners[event.type] && this.listeners[event.type][event.event]) {
		this.listeners[event.type][event.event].forEach((el) => {
			el.call(this, event);
		}, this);
	}

	if(event.room && !(this instanceof Torus.classes.Chat) && !(this instanceof Torus.classes.Extension)) {
		event.room.call_listeners(event);
	}
	return true;
};

/**
 * Opens a room in the specified wiki
 * If the room is private, `parent` and `users` parameters are required
 * @param {String} domain Wiki domain on which to open the room
 * @param {Torus.classes.Chat} parent Parent room of the private room
 * @param {Array<String>} users Users that are in the room
 */
Torus.open = (domain, parent, users) => {
	var chat = Torus.chats[domain] || new Torus.classes.Chat(domain, parent, users);
	if(!chat.connecting && !chat.connected) {
		chat.connect();
	}
	return chat;
};

/**
 * Sends the logout signal to the server
 * and disconnects from the chat server
 */
Torus.logout = () => {
	for(var i in Torus.chats) {
		if(Torus.chats.hasOwnProperty(i) && i > 0) {
			var chat = Torus.chats[i];
			chat.send_command('logout');
			Torus.call_listeners(new Torus.classes.ChatEvent('logout', chat));
			chat.disconnect('logout');
		}
	}
};

/**
 * Shows a message to specified room(s)
 * By default, shows the message in #status
 * @param {String} text Message to send
 * @param {Torus.classes.Chat} room Room to send the message in
 */
Torus.alert = (text, room) => {
	room = room || Torus.chats[0];
	text = text.trim();
	if(text.indexOf('\n') !== -1) {
		var spl = text.split('\n');
		for(var i = 0; i < spl.length; i++) {
			var event = new Torus.classes.IOEvent('alert', room);
			event.text = spl[i];
			Torus.call_listeners(event);
		}
	} else {
		var event = new Torus.classes.IOEvent('alert', room);
		event.text = text;
		Torus.call_listeners(event);
	}
};

/**
 * Shows the current version in a pretty format
 * @return {String} stringified version
 */
Torus.get_version = function() {
	return `${this.version.major}.${this.version.minor}.${this.version.patch}`;
};

/**
 * Preloads application data from files
 */
Torus.preload = () => {
	Torus.load_data([
		['data', 'files'],
		['i18n', 'i18n']
	], () => {
		Torus.add_onload_listener(Torus.user.init.bind(Torus.user));
	});
};

/**
 * Loads all JSON files from a directory to the supplied Torus object property
 * @todo Error handling
 * @param {String} dir The directory to load files from
 * @param {String} loadto The Torus object property to load to
 */
Torus.load_data = (data, cb) => {
	if(!(data instanceof Array)) {
		throw new Error('`data` parameter must be an array (load_data)');
	}
	let loading = data.length;
	data.forEach((el) => {
		const dir = el[0],
			  loadto = el[1];
		Torus.util.read_dir(dir, (d) => {
			d.forEach((file) => {
				if(file.endsWith('.json')) {
					const name = file.substring(0, file.length - 5);
					Torus[loadto] = Torus[loadto] || {};
					Torus[loadto][name] = Torus[loadto][name] || {};
					Torus.util.softmerge(Torus[loadto][name], require(`${__dirname}/${dir}/${file}`));
		        }
			});
			if(--loading === 0) {
				if(typeof cb === 'function') {
					cb.call(Torus);
				}
			}
		});
	});
};

Torus.onload = () => {
	Torus.load_ext('themes');
	Torus.load_ext('commands');
	if(Torus.debug) {
		Torus.load_ext('logs');
	}
	Torus.call_listeners(new Torus.classes.WindowEvent('load'));
	new Torus.classes.Chat(0);
	Torus.ui.onload();
};

Torus.initialize = () => {
	Torus.alert(Torus.i18n.text('logged-in'));
	Torus.init = true;
};

Torus.unload = () => {
	Torus.logout();
	Torus.call_listeners(new Torus.classes.WindowEvent('unload'));
};

window.addEventListener('beforeunload', Torus.unload);
