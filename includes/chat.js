Torus.classes.Chat = function(domain, parent, users) {
	if(!(this instanceof Torus.classes.Chat)) {
		throw new Error('Must call Torus.classes.Chat with `new`.');
	}
	if(!domain && domain !== 0) {
		throw new Error('Torus.classes.Chat: Tried to create room with no domain.');}

	if(Torus.chats[domain]) {
		throw new Error('Torus.classes.Chat: Tried to create room `' + name + '` but it already exists.');
	}
	this.domain = domain;
	Torus.chats[domain] = this;
	if(domain) { //this is a normal room
		if(parent) { //PM
			this.id = domain * 1;
			this.parent = parent;
			this.priv_users = users;

			if(this.priv_users.length === 2) {
				for(var i = 0; i < this.priv_users.length; i++) {
					if(this.priv_users[i] !== Torus.user.name) {
						this.name = 'PM: ' + this.priv_users[i];
						break;
					}
				}
			} else {
				this.name = this.domain;
			}
		} else { // public
			this.id = 1; // this'll get overwriten later
			this.parent = false;
			this.name = this.domain;
		}
		// this.away_timeout = 0;
		this.connected = false;
		this.connecting = false;
		this.socket = false;
		this.users = 0;
		this.userlist = {};
		this.listeners = {
			chat: {},
			io: {},
		};
	} else { // this is the status room
		this.id = 0;
		this.name = 'status';
		this.listeners = {
			chat: {},
			io: {},
		};
	}
	var event = new Torus.classes.ChatEvent('new', this);
	Torus.call_listeners(event);
};

Torus.classes.Chat.socket_connect = function(event) {
	event.sock.chat.connecting = false;
	event.sock.chat.connected = true;
	event.sock.chat.send_command('initquery');
	Torus.io.getBlockedPrivate(); // FIXME: can probably be moved to Torus.onload
	Torus.call_listeners(new Torus.classes.ChatEvent('connected', event.sock.chat));
};

Torus.classes.Chat.socket_message = function(event) {
	var data = event.message.data ? JSON.parse(event.message.data) : {},
		e = event.sock.chat['event_' + event.message.event](data);
	Torus.call_listeners(e);
};

Torus.classes.Chat.prototype.connect = function(transport) {
	if(this.connected || this.connecting) {
		throw new Error('Tried to open ' + this.domain + ' which is already open. (Chat.connect)');
	}
	transport = transport || 'polling';
	this.connecting = true;
	var info = this.parent ? {
		host: this.parent.socket.host,
		port: this.parent.socket.port,
		wiki: this.parent.socket.wiki,
		room: this.id,
		key: this.parent.socket.key
	} : {};
	this.socket = new Torus.io.transports[transport](this.domain, info);
	this.socket.chat = this;
	this.socket.add_listener('io', 'connect', Torus.classes.Chat.socket_connect);
	this.socket.add_listener('io', 'disconnect', this.socket_disconnect);
	this.socket.add_listener('io', 'message', Torus.classes.Chat.socket_message);

	Torus.call_listeners(new Torus.classes.ChatEvent('open', this));
};

Torus.classes.Chat.prototype.reconnect = function() {
	this.socket.close('reconnect');
	this.connected = false;
	this.connecting = false;
	this.connect(this.socket.transport);
	Torus.call_listeners(new Torus.classes.ChatEvent('reopen', this));
};

Torus.classes.Chat.prototype.disconnect = function(reason){
	if(!this.socket) {
		return;
	}
	this.socket.close(reason);
	this.socket = false;
	this.connecting = false;
	this.connected = false;
};

Torus.classes.Chat.prototype.socket_disconnect = function(event) {
	event.sock.chat.connecting = false;
	event.sock.chat.connected = false;
	var e = new Torus.classes.ChatEvent('close', event.sock.chat);
	e.reason = event.reason;
	Torus.call_listeners(e);

	event.sock.chat.users = 0;
	event.sock.chat.userlist = {};
};

Torus.classes.Chat.prototype.send_message = function(text) {
	if(!this.connected) {
		throw new Error(`Tried to send a message to room ${this.domain} before it finished connecting. (Chat.send_message)`);
	}
	text += '';
	var message = {
			attrs: {
				msgType: 'chat',
				text: text,
				name: Torus.user.name
			}
		},
		event = new Torus.classes.ChatEvent(`send_${text.indexOf('/me') === 0 ? 'me' : 'message'}`, this);
	event.message = message;
	Torus.call_listeners(event);
	if(this.parent) {
		this.parent.send_command('openprivate', {
			roomId: this.id,
			users: this.users
		});
	}
	this.socket.send(JSON.stringify(message));
};

Torus.classes.Chat.prototype.send_command = function(command, args) {
	if(!this.connected) {
		throw new Error(`Tried to send a command to room ${this.domain} before it finished connecting. (Chat.send_command)`);
	}
	args = args || {};

	var message = {
		attrs: Torus.util.softmerge({
			msgType: 'command',
			command: command
		}, args)
	};

	var event = new Torus.classes.ChatEvent(command, this);
	event.message = message;
	Torus.call_listeners(event);

	this.socket.send(JSON.stringify(message));
};

Torus.classes.Chat.prototype.set_status = function(state, message) {
	var user = this.userlist[Torus.user.name];
	state = state || user.status_state;
	message = message || user.status_message;
	user.old_state = user.status_state;
	user.old_message = user.status_message;
	this.send_command('setstatus', {
		statusState: state,
		statusMessage: message
	});
};

Torus.classes.Chat.prototype.ctcp = function(target, proto, data) {
	target = target || ''; // everyone
	proto = proto || 'version';
	data = data || '';
	var base = this.userlist[Torus.user.name],
		state = base.status_state,
		message = base.status_message;
	this.send_command('setstatus', {
		statusState: 'CTCP|' + target + '|' + proto,
		statusMessage: data
	});
	this.send_command('setstatus', {
		statusState: state,
		statusMessage: message
	});
};

/**
 * Gives moderator permissions to a user
 * @param {String} user User to promote
 */
Torus.classes.Chat.prototype.mod = function(user) {
	this.send_command('givechatmod', { userToPromote: user });
};

/**
 * Kicks a user out of chat
 * @param {String} user User to kick
 */
Torus.classes.Chat.prototype.kick = function(user) {
	this.send_command('kick', {userToKick: user});
};

/**
 * Bans a user from chat
 * @param {String} user User to ban
 * @param {String} expiry Expiry of the ban
 * @param {String} reason Ban reason
 */
Torus.classes.Chat.prototype.ban = function(user, expiry, reason) {
	if(typeof expiry === 'string') {
		expiry = Torus.util.expiry_to_seconds(expiry);
	}
	reason = reason || 'Misbehaving in chat'; // FIXME: ?action=query&meta=allmessages

	this.send_command('ban', {userToBan: user, reason: reason, time: expiry});
};

/**
 * Unbans a user from chat
 * @param {String} user User to unban
 * @param {String} reason Reason for unbanning
 */
Torus.classes.Chat.prototype.unban = function(user, reason) {
	reason = reason || 'undo'; // FIXME: ?action=query&meta=allmessages
	return this.ban(user, 0, reason);
};

/**
 * Opens a private room with users
 * @param {String} users Users to start a private room with
 * @param {String} callback Function to call when room ID is fetched
 * @param {Number} id ID of the private room to start.
 *					  If not specified, fetches it from index.php
 */
Torus.classes.Chat.prototype.open_private = function(users, callback, id) {
	if(!users.includes(Torus.user.name)) {
		users.push(Torus.user.name);
	}
	if(id) {
		let pm = Torus.open(id * 1, this, users);
		if(typeof callback === 'function') {
			callback.call(pm, new Torus.classes.ChatEvent('open', pm));
		}
	} else {
		let c = this; // FIXME: this forces a closure scope
		Torus.io.getPrivateId(users, (id) => {
			return c.open_private(users, callback, id);
		});
	}
};

/**
 * Event that gets fired when user joins the room
 * It gives information about scrollback and userlist
 * @param {Object} data Information about the room
 */
Torus.classes.Chat.prototype.event_initial = function(data) {
	var event = new Torus.classes.IOEvent('initial', this);

	this.users = 0;
	this.userlist = {}; // clear current userlist, this list is 100% accurate and ours might not be

	event.users = [];
	data.collections.users.models.forEach((el) => {
		event.users.push(this.event_updateUser(el));
	}, this);
	event.messages = [];
	data.collections.chats.models.forEach((el) => {
		event.messages.push(this['event_chat:add'](el));
	}, this);
	if(this.parent) {
		event.parent = this.parent;
	}
	//this.awayTimeout = setTimeout('Torus.io.setStatus(' + Torus.ui.active + ', \'away\', \'\'); Torus.chats[' + Torus.ui.active + '].autoAway = true;', 5 * 60 * 1000);
	return event;
};

/**
 * Event called upon sending a message
 * @param {Object} data Information about the message
 */
Torus.classes.Chat.prototype['event_chat:add'] = function(data) {
	var event = new Torus.classes.IOEvent('chat:add', this);

	if(!data.attrs.isInlineAlert) {
		if(data.attrs.text.indexOf('/me') === 0) {
			event.event = 'me';
			event.text = data.attrs.text.substring(3).trim();
		} else {
			event.event = 'message';
			event.text = data.attrs.text;
		}
		event.user = data.attrs.name;
		event.id = data.attrs.timeStamp;
		event.time = data.attrs.timeStamp;
	} else if(data.attrs.wfMsg) {
		switch(data.attrs.wfMsg) {
			case 'chat-inlinealert-a-made-b-chatmod':
				event.event = 'mod';
				event.performer = data.attrs.msgParams[0];
				event.target = data.attrs.msgParams[1];
				break;
			case 'chat-err-connected-from-another-browser':
				event.event = 'error';
				event.error = 'error-otherbrowser';
				event.args = [this.domain];
				break;
			case 'chat-kick-cant-kick-moderator':
				event.event = 'error';
				event.error = 'error-cantkickmods';
				event.args = [];
				break;
			default:
				console.log(event);
				break;
		}
	} else {
		event.event = 'alert';
		event.text = data.attrs.text;
		console.log('got an alert from the server:', data); // this shouldn't actually happen so if it does i wanna know
	}
	return event;
};

/**
 * Event happening when a user joins a room
 * @param {Object} data Information about the user
 */
Torus.classes.Chat.prototype.event_join = function(data) {
	let type = Boolean(this.userlist[data.attrs.name]) ? 'rejoin' : 'join',
		event = this.event_updateUser(data);
	event.event = type;
	return event;
};

/**
 * Event happening when a user status message updates (here/away/anything else)
 * Handling of incoming client-to-client protocol requests is here
 * @param {Object} data Information about the updated user
 */
Torus.classes.Chat.prototype.event_updateUser = function(data) {
	var event = new Torus.classes.IOEvent('update_user', this);

	event.user = data.attrs.name;
	event.data = {
		avatar: data.attrs.avatarSrc,
		mod: data.attrs.isModerator,
		staff: data.attrs.isStaff,
		givemod: data.attrs.canPromoteModerator,
		status_state: data.attrs.statusState,
		status_message: data.attrs.statusMessage,
		edits: data.attrs.editCount,
	};
	event.data.edits = event.data.edits.replace(/,/g, '');
	event.data.edits *= 1;

	if(event.data.status_state.indexOf('CTCP|') === 0) {
		var split = event.data.status_state.split('|'),
			target = split[1].trim(),
			proto = split[2].trim().toLowerCase();
		if(event.user === Torus.user.name || target === Torus.user.name || target === '') {
			event.event = 'ctcp';
			event.target = target;
			event.proto = proto;
			event.data = event.data.status_message;
			if(event.user !== Torus.user.name && proto === 'version' && event.data === '') {
				this.ctcp(event.user, 'version', `Torus-standalone/${Torus.get_version()}`);
			}
			return event;
		}
	}

	if(!this.userlist[data.attrs.name]) {
		this.users++;
		this.userlist[data.attrs.name] = event.data;
	} else {
		for(var i in event.data) {
			this.userlist[data.attrs.name][i] = event.data[i];
		}
	}
	return event;
};

/**
 * Event happening when a user exits the chat
 * @param {Object} data Data about the user that parted
 */
Torus.classes.Chat.prototype.event_part = function(data) {
	var event = new Torus.classes.IOEvent('part', this);

	event.user = data.attrs.name;
	if(this.userlist[data.attrs.name]) {
		--this.users;
		delete this.userlist[data.attrs.name];
	} else {
		event.event = 'ghost'; // ghost part
	}
	return event;
};

/**
 * Event happening when a user sends a logout signal to the server
 * It doesn't neccessarily mean the user exited because Wikia was that stupid not to
 * completely stop the communication with the user that sent the logout signal
 * so sending the logout signal can be abused
 * @param {Object} data Information about the user that sent the logout signal
 */
Torus.classes.Chat.prototype.event_logout = function(data) {
	var event = this.event_part(data);
	event.event = 'logout';
	return event;
};

/**
 * Event happening when a user gets banned
 * @param {Object} data Information about the ban
 */
Torus.classes.Chat.prototype.event_ban = function(data) {
	var event = this.event_kick(data);
	if(data.attrs.time === 0) {
		event.event = 'unban';
	} else {
		event.event = 'ban';
		event.seconds = data.attrs.time;
		event.expiry = Torus.util.seconds_to_expiry(data.attrs.time);
	}
	return event;
};

/**
 * Event happening when a user gets kicked
 * @param {Object} data Information about the kick
 */
Torus.classes.Chat.prototype.event_kick = function(data) {
	var event = new Torus.classes.IOEvent('kick', this);
	event.target = data.attrs.kickedUserName;
	event.performer = data.attrs.moderatorName;
	return event;
};

/**
 * Event happening when another user sends a private room message
 * @param {Object} data Information about the private room
 */
Torus.classes.Chat.prototype.event_openPrivateRoom = function(data) {
	var event = new Torus.classes.IOEvent('open_private', this),
		blocked = false;
	for(var i = 0; i < data.attrs.users.length; ++i) {
		if(Torus.data.blocked.includes(data.attrs.users[i])) {
			blocked = true;
			break;
		}
	}
	event.private = blocked ? false : Torus.open(data.attrs.roomId * 1, this, data.attrs.users);
	event.users = data.attrs.users;
	return event;
};

/**
 * Event happening when the server forces a reconnect
 * This mostly happens when a user connects through another browser
 * @param {Object} data Event data
 */
Torus.classes.Chat.prototype.event_forceReconnect = function() {
	this.reconnect();
	return new Torus.classes.IOEvent('force_reconnect', this);
};

/**
 * Event happening when the server doesn't want the client to reconnect
 * This mostly happens after bans and/or kicks
 * @param {Object} data Event data
 */
Torus.classes.Chat.prototype.event_disableReconnect = function() {
	var event = new Torus.classes.IOEvent('force_disconnect', this);
	Torus.call_listeners(event);
	return event;
};

/**
 * Event happening when the user sends a too long message,
 * i.e. the message exceeds 1000 characters
 * @param {Object} data Event data
 */
Torus.classes.Chat.prototype.event_longMessage = function() {
	var event = new Torus.classes.IOEvent('error', this);
	event.error = 'error-longmessage';
	event.args = [];
	return event;
};

Torus.classes.Chat.prototype.add_listener = Torus.add_listener;
Torus.classes.Chat.prototype.remove_listener = Torus.remove_listener;
Torus.classes.Chat.prototype.call_listeners = Torus.call_listeners;
