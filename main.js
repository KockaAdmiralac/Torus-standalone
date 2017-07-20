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

global.Torus = {
    electron: require('electron'),
    fs: require('fs'),
    init: false,
	version: {
		major: 0,
		minor: 1,
		patch: 2
	},
	debug: true,
	files: {},
	cache: {},
	listeners: {},
	classes: {},
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
	},
    util: require('./includes/util.js')
};

/**
 * Adds an event listener
 * @param {String} type Event type
 * @param {String} event Event to listen for
 * @param {Function} func Callback
 */
Torus.addListener = function(type, event, func) {
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
Torus.addOnloadListener = function(func) {
	if(document.readyState === 'complete') {
		func.call(Torus);
	} else {
		this.addListener('window', 'load', func);
	}
};

/**
 * Function for removing an event listener
 * Accepts the event name and the listener function
 * Returns true if the listener is removed, otherwise false
 */
Torus.removeListener = function(type, event, func) {
	if(!this.listeners[type] || !this.listeners[type][event]) {
		return false;
	}
    let listeners = this.listeners[type][event],
        index = listeners.indexOf(func);
    if(func !== -1) {
        listeners.splice(index, 1);
        return true;
    }
	return false;
};

/**
 * Function for calling listeners for an event
 * @param {String} event Event name
 * @return {Boolean} If type is valid
 */
Torus.callListeners = function(type, event, data) {
	if(!type || !event) {
		throw new Error('Invalid parameters: \'type\' or \'event\' parameter must be passed (Torus.callListeners)');
	}
	if(this.listeners[type] && this.listeners[type][event]) {
		this.listeners[type][event].forEach(el => el.call(this, data), this);
	}
	if(data && data.room && !(this instanceof Torus.classes.Chat) && !(this instanceof Torus.classes.Extension)) {
		data.room.callListeners(event);
	}
	return true;
};

/**
 * Shows the current version in a pretty format
 * @return {String} stringified version
 */
Torus.getVersion = function() {
	return `${Torus.version.major}.${Torus.version.minor}.${Torus.version.patch}`;
};

/**
 * Preloads application data from files
 */
Torus.preloadData = function() {
	Torus.loadData({
		data: 'files',
		i18n: 'i18n'
	}, function() {
		Torus.addOnloadListener(Torus.user.init.bind(Torus.user));
	});
};

/**
 * Loads all JSON files from a directory to the supplied Torus object property
 * @todo Error handling
 * @param {String} dir The directory to load files from
 * @param {String} loadto The Torus object property to load to
 */
Torus.loadData = function(data, cb) {
	if(!(data instanceof Array)) {
		throw new Error('`data` parameter must be an array (Torus.loadData)');
	}
	let loading = data.length;
	data.forEach(function(el) {
		const dir = el[0],
			  loadto = el[1];
		Torus.util.readDir(dir, function(d) {
			d.forEach(function(file) {
				if(file.endsWith('.json')) {
					const name = file.substring(0, file.length - 5);
					Torus[loadto] = Torus[loadto] || {};
					Torus[loadto][name] = Torus[loadto][name] || {};
					Torus.util.softmerge(Torus[loadto][name], require(`./${dir}/${file}`));
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

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
Torus.createWindow = function() {
    if(Torus.window) {
        return;
    }
    const window = new Torus.electron.BrowserWindow({ show: false });
    window.maximize();
    window.loadURL(`file://${__dirname}/index.html`);
    window.webContents.openDevTools();
    window.on('closed', Torus.onWindowClose);
    window.once('ready-to-show', Torus.onWindowReady);
    Torus.window = window;
    Torus.loadExt('themes');
	Torus.loadExt('commands');
	if(Torus.debug) {
		Torus.loadExt('logs');
	}
    Torus.chats.initialize();
};

Torus.onWindowReady = function() {
    Torus.window.show();
};

Torus.onWindowClose = function() {
    Torus.window = null;
};

Torus.onload = function() {
    let app = Torus.electron.app;
    app.on('ready', Torus.createWindow);
    app.on('window-all-closed', Torus.close);
    app.on('activate', Torus.createWindow);
};

Torus.initialize = function() {
	Torus.alert(Torus.i18n.text('logged-in'));
	Torus.init = true;
};

Torus.unload = function(){
	Torus.logout();
	Torus.callListeners(new Torus.classes.WindowEvent('unload'));
};

/**
 * Quit when all windows are closed.
 */
Torus.close = function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        Torus.electron.app.quit();
    }
};

Torus.util.loadModules(['cache', 'chats', 'io',' user'], 'includes', Torus);
Torus.util.loadModules(['chat', 'ext'], 'includes', Torus.classes);
Torus.onload();
