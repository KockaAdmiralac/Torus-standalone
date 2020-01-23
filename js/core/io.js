/**
 * io.js
 *
 * I/O functions for communicating with various APIs
 * Some of the methods are in Torus.user
 */
Torus.io = {};

Torus.io.xhr = function(options) { // TODO: USE PROMISES FFS
	var url = options.url,
		params = options.data,
		method = options.type || 'GET',
		success = options.success,
		error = options.error,
		responseType = options.responseType || 'json',
		contentType = options.contentType;
	if(!url) {
		throw new Error('URL must be specified (Torus.io.xhr)');
	}
	if(params) {
		var first = true;
		for(var i in params) {
			if(params.hasOwnProperty(i)) {
				url += `${first ? '?' : '&'}${encodeURIComponent(i)}=${encodeURIComponent(params[i])}`;
				first = false;
			}
		}
		url += '&t=';
	} else {
		url += '?t=';
	}
	url += Math.random() * 100000000000000000;
	if(url[0] === '/') {
		url = `http://community.wikia.com${url}`;
	}
	var xhr = new XMLHttpRequest();
	xhr.addEventListener('loadend', function() {
		if(this.status === 200) {
			if(typeof success === 'function') {
				success.call(Torus, this.response);
			}
		} else if(typeof error === 'function') {
			error.call(Torus, this.status);
		}
	});
	xhr.open(method, url, true);
	xhr.responseType = responseType;
	xhr.setRequestHeader('Cache-Control', 'no-cache');
	if(contentType) {
		xhr.setRequestHeader('Content-Type', contentType);
	}
	xhr.setRequestHeader('Api-Client', `Torus-standalone/${Torus.get_version()}`);
	xhr.send();
};

Torus.io.ajax = function(method, post, callback) {
	Torus.io.xhr({
		type: 'POST',
		url: '/index.php',
		data: Torus.util.softmerge(post, {
			action: 'ajax',
			rs: 'ChatAjax',
			method: method
		}),
		contentType: 'application/x-www-form-urlencoded',
		success: (data) => {
			if(typeof callback === 'function') {
				callback.call(Torus, data);
			}
		},
		error: (code) => {
			throw new Error(`Request returned response ${code}. (io.ajax)`);
		}
	});
};

Torus.io.api = function(method, action, data, success, error, wiki) {
	Torus.io.xhr({
		url: (wiki ? `http://${wiki}.wikia.com` : '') + '/api.php',
		type: method || 'GET',
		data: Torus.util.softmerge({
			action: action,
			format: 'json'
		}, data),
		success: (data) => {
			if(!data || data.error) {
				if(typeof error === 'function') {
					error.call(Torus, true, data ? data.error.code : null);
				}
			} else if(typeof success === 'function') {
				success.call(Torus, data);
			}
		},
		error: (code) => {
			if(typeof error === 'function') {
				error.call(Torus, false, code);
			}
		}
	});
};

Torus.io.getPrivateId = function(users, callback) {
	Torus.io.ajax('getPrivateRoomId', {
		users: JSON.stringify(users),
		token: Torus.user.token
	}, (data) => {
		if(typeof callback === 'function') {
			callback.call(Torus, data.id);
		}
	});
};

Torus.io.getBlockedPrivate = function(callback) {
	Torus.io.ajax('getPrivateBlocks', {}, (data) => {
		Torus.data.blockedBy = data.blockedByChatUsers;
		Torus.data.blocked = data.blockedChatUsers;
		if(typeof callback === 'function') {
			callback.call(Torus, data);
		}
	});
};

Torus.io.block = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {
		userToBan: user,
		dir: 'add'
	}, (data) => {
		Torus.data.blocked.push(user);
		if(typeof callback === 'function') {
			callback.call(Torus, data);
		}
	});
};

Torus.io.unblock = function(user, callback) {
	Torus.io.ajax('blockOrBanChat', {
		userToBan: user,
		dir: 'remove'
	}, (data) => {
		for(var i = 0; i < Torus.data.blocked.length; i++) {
			if(Torus.data.blocked[i] === user) {
				Torus.data.blocked.splice(i, 1); break;
			}
		}
		if(typeof callback === 'function') {
			callback.call(Torus, data);
		}
	});
};

Torus.io.key = function(wiki, success, error) {
	Torus.io.xhr({
		url: `http://${wiki}.wikia.com/wikia.php`,
		type: 'GET',
		data: {
			controller: 'Chat',
			format: 'json'
		},
		success: success,
		error: error,
		responseType: 'json'
	});
};

Torus.io.id = function(wiki, success, error) {
    Torus.io.api('GET', 'query', {
        meta: 'siteinfo',
        siprop: 'wikidesc'
    }, success, error, wiki);
};

/**
 * Transports used in communicating with the chat server
 */
Torus.io.transports = {};

Torus.io.transports.polling = function(domain, info) {
	if(!(this instanceof Torus.io.transports.polling)) {
		throw new Error('Must create transport with `new`.');
	}

	this.open = true;
	this.domain = domain;
	this.host = info.host;
	this.port = info.port;
	this.wiki = info.wiki;
	this.room = info.room;
	this.key = info.key;
	this.session = '';
	this.url = '';
	this.xhr = null;
	this.ping_interval = 0;
	this.iid = 0;
	this.retries = 0;
	this.listeners = { io: {} };

	if(!this.host || !this.port || !this.room || !this.key) {
		Torus.io.key(this.domain, function(d) {
            if(!d) {
                this.close('nochat');
                return;
            }
			this.host = d.chatServerHost;
			this.port = d.chatServerPort;
			this.room = d.roomId;
            this.key = d.chatkey;
			this.check();
		}.bind(this), function(e) {
            this.close('nochat');
        }.bind(this));
	}

	if(!this.wiki) {
		Torus.io.id(this.domain, function(d) {
			if(!d.query) {
				this.close('nochat');
				return;
			}
			this.wiki = d.query.wikidesc.id;
			this.check();
		}.bind(this), function(e) {
            this.close('nochat');
        }.bind(this));
	}
	this.check();
};

Torus.io.transports.polling.prototype.check = function() {
    if(this.host && this.port && this.wiki && this.room && this.key) {
		this.poll('init');
	}
};

Torus.io.transports.polling.prototype.poll = function(from) { //jshint ignore:line
	this.url = 'https://' + this.host + ':' + this.port + '/socket.io/?EIO=2&transport=polling&name=' + encodeURIComponent(Torus.user.name) + '&key=' + this.key + '&roomId=' + this.room + '&serverId=' + this.wiki;
	if(this.session) {
		this.url += '&sid=' + this.session;
	}
	if(this.xhr) {
		this.xhr.abort();
	}
	this.xhr = new XMLHttpRequest();
	this.xhr.sock = this;
	this.xhr.addEventListener('loadend', function() { // FIXME: hardcoded
		var sock = this.sock;
		if(sock.xhr !== this) {
			return;
		} else if(this.status === 200) {
			sock.retries = 0;
			var data = this.responseText,
				pinginterval = () => {
					sock.ping();
				};
			while(data.length > 0) {
				var colon = data.indexOf(':'),
					end = colon + 1 + Number(data.substring(0, colon)),
					text = data.substring(1 + colon, end),
					packet_type = Number(text.charAt(0));
				data = data.substring(end);
				text = text.substring(1);

				switch(packet_type) {
					case 0: // connect
						// we should only reach this once, hopefully
						var data = JSON.parse(text);
						sock.session = data.sid;
						sock.ping_interval = Math.floor(data.pingTimeout * 3 / 4); // pingTimeout is the longest we can go without disconnecting
						if(sock.iid) {
							clearInterval(sock.iid);
						}
						sock.iid = setInterval(pinginterval, sock.ping_interval); // FIXME: closure
						break;
					case 1: // disconnect
						// sock.close('server');
						sock.retry(); // F DA POLICE
						return;
					case 2: // ping
						sock.ping();
						break;
					case 4: // message
						var message_type = text.charAt(0) * 1;
						text = text.substring(1);
						switch(message_type) { // yep, there are two of these
							case 0: // connect
								sock.call_listeners({
									type: 'io',
									event: 'connect',
									sock: sock,
								});
								break;
							case 1: // disconnect
								sock.retry();
								return;
							case 2: // event
								sock.call_listeners({
									type: 'io',
									event: 'message',
									message: JSON.parse(text)[1],
									sock: sock,
								});
								break;
							case 4: // error
								sock.close('protocol');
								return;
							case 3: // ack
							case 5: // binary event
							case 6: // binary ack
								console.log('Unimplemented data type: ' + this.responseText);
								sock.close('protocol');
								return;
						}
						break;
					case 3: // pong
					case 6: // noop
						break;
					case 5: // upgrade
					default:
						console.log('Unimplemented data type: ' + this.responseText);
						sock.close('protocol');
						return;
				}
			}
			this.sock.poll('poll 200');
		} else if(this.status === 400 || this.status === 404) {
			sock.retry();
		} else if(this.status !== 0) {
			sock.close('http');
		} else if(sock.open && this.statusText !== 'abort') {
			sock.retry();
		}
	});
	this.xhr.addEventListener('error', Torus.util.debug);
	this.xhr.open('GET', this.url, true);
	//this.xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	this.xhr.send();
};
Torus.io.transports.polling.prototype.send = function(message) {
	var data = `42["message",${JSON.stringify(message)}]`,
		xhr = new XMLHttpRequest(); // FIXME: put these somewhere
	xhr.sock = this;
	xhr.addEventListener('loadend', function() {
		if(this.status === 200) {
			this.sock.retries = 0;
		} else if(this.status === 400 || this.status === 404 || (this.status === 0 && this.sock.open)) {
			this.sock.retry();
		}
	});
	xhr.open('POST', this.url, true);
	xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
	//xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	xhr.send(data.length + ':' + data);
};
Torus.io.transports.polling.prototype.ping = function() {
	this.ping_xhr = new XMLHttpRequest();
	this.ping_xhr.sock = this;
	this.ping_xhr.addEventListener('loadend', function() {
		if(this.sock.ping_xhr !== this) {
			return;
		} else if(this.status === 200) {
			this.sock.retries = 0;
		} else if(this.status === 400 || this.status === 404 || (this.status === 0 && this.sock.open)) {
			this.sock.retry();
		}
		this.sock.ping_xhr = null;
	});
	this.ping_xhr.open('POST', this.url, true);
	this.ping_xhr.setRequestHeader('Content-Type', 'text/plain;charset=utf-8');
	// xhr.setRequestHeader('Api-Client', 'Torus/' + Torus.version);
	this.ping_xhr.send('1:2');
};
Torus.io.transports.polling.prototype.close = function(reason) {
	if(!this.open) {
		return;
	}

	this.open = false;
	if(this.xhr) {
		this.xhr.abort();
		this.xhr = null;
	}
	if(this.ping_xhr) {
		this.ping_xhr.abort();
		this.ping_xhr = null;
	}
	if(this.iid) {
		clearInterval(this.iid);
		this.iid = 0;
	}
	this.call_listeners({
		type: 'io',
		event: 'disconnect',
		reason: reason,
		sock: this,
	});
};
Torus.io.transports.polling.prototype.retry = function() {
	if(!this.open) {
		return;
	}

	this.retries++;
	if(this.retries > 5) {
		this.close('dropped');
		return;
	}
	this.url = '';
	this.session = '';
	this.poll('retry');
};
Torus.io.transports.polling.prototype.add_listener = Torus.add_listener;
Torus.io.transports.polling.prototype.remove_listener = Torus.remove_listener;
Torus.io.transports.polling.prototype.call_listeners = Torus.call_listeners;
