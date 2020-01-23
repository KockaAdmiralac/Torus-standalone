/**
 * main.js
 *
 * Main code for commands extension
 */

/**
 * Command for joining a room
 * @param {String} room Room to join
 */
Torus.ext.commands.join = (room) => {
	if(room === '0') {
		Torus.logout();
	} else {
		Torus.open(room);
	}
};

/**
 * Command for leaving a room
 * @param {String} room Room to leave
 */
Torus.ext.commands.part = (room) => {
	if(room) {
		let chat = Torus.chats[room];
		if(!chat || (!chat.connecting && !chat.connected)) {
			return `Invalid room ${room}.`; // FIXME: i18n
		} else {
			chat.disconnect('closed');
		}
	} else {
		Torus.ui.active.disconnect('closed');
	}
};
Torus.ext.commands.quit = 'logout';
Torus.ext.commands.logout = Torus.logout;

/**
 * Command for kicking a user from a room
 * @param {Array<String>} args User's name, split by spaces
 */
Torus.ext.commands.kick = (...args) => {
	Torus.ui.active.kick(args.join(' '));
};

/**
 * Command for banning a user from chat
 * @param {String} user User to ban
 * @param {String} expiry Length of the ban
 * @param {String} summary Description of the ban. Set to 'Misbehaving in chat' by default
 * @todo i18n (?action=query&meta=allmessages)
 */
Torus.ext.commands.ban = (user, expiry, summary) => {
	Torus.ui.active.ban(user, expiry, summary || 'Misbehaving in chat');
};

/**
 * Command for removing a ban from a user
 * @param {Array<String>} args User to unban
 * @todo i18n (?action=query&meta=allmessages)
 */
Torus.ext.commands.unban = (...args) => {
	Torus.ui.active.ban(args.join(' '), 0, 'undo');
};

Torus.ext.commands.mod = 'givemod';

/**
 * Command for giving chat moderator permissions to a person
 * @param {Array<String>} args User to give chat moderator permissions to
 */
Torus.ext.commands.givemod = (...args) => {
	Torus.ui.active.mod(args.join(' '));
};
Torus.ext.commands.pm = 'private';
Torus.ext.commands.query = 'private';
Torus.ext.commands.priv = 'private';

/**
 * Command for private messaging users
 * @param {Array<String>} args Users to privately message
 */
Torus.ext.commands.private = (...args) => {
	Torus.ui.active.open_private(args);
};

/**
 * Command for setting status to away with a message
 * @param {String} message Message to set
 */
Torus.ext.commands.away = (message) => {
	let user = Torus.ui.active.userlist[Torus.user.name],
		args = user.status_state === 'away' ?
			       user.old_state === 'away' ?
				       ['here', ''] :
					   [user.old_state, user.old_message] :
				   ['away', message];
	Torus.ui.active.set_status.apply(this, args);
};

/**
 * Command for setting status to here with a message
 * @param {String} message Message to set
 */
Torus.ext.commands.back = (message) => {
	Torus.ui.active.set_status('here', message || '');
};

/**
 * Command for setting a custom status with a message
 * @param {String} state State to set
 * @param {String} message Message to set
 */
Torus.ext.commands.status = (state, message) => {
	Torus.ui.active.set_status(state, message);
};

/**
 * Command for communication using a client-to-client protocol (CTCP)
 * @param {String} target User to communicate with
 * @param {String} proto Property to retain from the user
 * @param {String} message Message to send
 */
Torus.ext.commands.ctcp = (target, proto, message) => {
	Torus.ui.active.ctcp(target, proto, message);
};

/**
 * Command for opening the options screen
 * @todo Make this extension-dependent
 */
Torus.ext.commands.options = () => {
	Torus.ui.activate(Torus.ext.options);
};

/**
 * Command for showing help text for a certain command
 * @param {Array<String>} args Command to get help with
 */
Torus.ext.commands.help = (...args) => {
	let str = args.join(' ');
	if(str) {
		let help = Torus.ext.commands.eval(str, true);
		if(help) {
			return Torus.i18n.text('commands-help', str, Torus.i18n.text(`commands-help-${help}`));
		} else {
			Torus.alert(Torus.i18n.text('commands-nohelp', str));
		}
	} else {
		let coms = '',
			shorts = '';
		for(var i in Torus.ext.commands) {
			if(Torus.ext.commands.hasOwnProperty(i) && i !== 'eval') {
				if(typeof Torus.ext.commands[i] === 'function') {
					coms += ', ' + i;
				} else if(typeof Torus.ext.commands[i] === 'string') {
					shorts += ', ' + i;
				}
			}
		}
		coms = coms.substring(2);
		shorts = shorts.substring(2);
		return Torus.i18n.text('commands-dir', coms, shorts);
	}
};

/**
 * Evaluates the supplied command
 * @param {String} str Command along with parameters
 * @param {Boolean} getname If to only get the name of command
 */
Torus.ext.commands.eval = (str, getname) => {
	if(typeof str !== 'string') {
		return false;
	}
	let com = str.split(' '),
		ref = Torus.ext.commands;
	if(typeof ref[com[0]] === 'string') {
		com[0] = ref[com[0]];
		return ref.eval(com.join(' '), getname);
	} else if(com[0] === 'eval') {
		return;
	}
	for(var i = 0; i < com.length; ++i) {
		if(com[i].charAt(0) === '"') {
			com[i] = com[i].substring(1);
			if(com[i].charAt(com[i].length - 1) === '"') {
				com[i] = com[i].substring(0, com[i].length - 1);
			} else {
				var j = i + 1;
				for(j; j < com.length && com[j].charAt(com[j].length - 1) !== '"'; ++j) {
					com[i] += ' ' + com[j];
				}
				com[i] += ' ' + com[j].substring(0, com[j].length - 1);
				com.splice(i + 1, j - i);
			}
		}
	}

	var name = com[0],
		command = ref[name];
	return typeof command === 'function' ?
		getname ?
			name :
			command.apply(ref, com.slice(1)) :
		false;
};

/**
 * Processes message before getting sent
 */
Torus.ext.commands.process_message = () => {
	let box = Torus.ui.ids['input-box'];
	if(Torus.ui.active.id >= 0 && Torus.user.token) {
		box.value.split('\n').forEach(function(el) {
			if(el.charAt(0) !== '/') {
				return;
			}
			let newval = el.replace(/^(\.|\\|\/)\//g, '/');
			if(el !== newval) {
				el = newval;
				return;
			} else {
				el = el.substring(1);
			}
			// /me isn't a command
			if(box.value.indexOf('/me') === 0) {
				return;
			}
			let index = box.value.indexOf('\n');
			box.value = (index === -1) ? '' : box.value.substring(index + 1);
			let result = Torus.ext.commands.eval(el);
			if(result === false) {
				Torus.alert(Torus.i18n.text('commands-notfound', el.substring(0, el.indexOf(' ') === -1 ?
					el.length :
					el.indexOf(' ')
				)));
			} else if(result) {
				Torus.alert(result.toString());
			}
		});
	}
};

Torus.add_listener('ui', 'beforesend', Torus.ext.commands.process_message);
