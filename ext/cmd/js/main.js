/**
 * cmd.js
 *
 * Extension allowing easier control over the client
 * through the developer tools (CTRL+SHIFT+I)
 */

/**
 * Passes the room to setup_room when a new room gets created
 * @param {Event} event Event sent in the room
 */
Torus.ext.cmd.new_room = (event) => {
	Torus.ext.cmd.setup_room(event.room);
};

/**
 * Sets up room listeners
 * @param {Torus.classes.Chat} room Room to set up
 */
Torus.ext.cmd.setup_room = (room) => {
	[
		'alert', 'message', 'me', 'join', 'update_user', 'part', 'logout',
		'ghost', 'ctcp', 'mod', 'kick', 'ban', 'unban', 'error'
	].forEach(function(el) {
		room.add_listener('io', el, Torus.ext.cmd.print_message);
	});
};

/**
 * Handles events happening in rooms and logs them in console
 * @param {Object} message Event data
 */
Torus.ext.cmd.print_message = (message) => {
	if(message.type !== 'io') {
		throw new Error('Event type must be \'io\' (ext.cmd.print_message)');
	}
	console.info(
		`%c[${Torus.util.timestamp(message.time)}] %c{${message.room.name}} %c${Torus.i18n.text.apply(Torus,
			[`cmd-${message.event}`].concat(Torus.ext.cmd.find_args(message))
		)}`,
		'color: gray; font-style: italic;',
		'color: red; font-weight: bold;',
		'color: black;'
	);
};

/**
 * Determines the message type and returns the respective arguments
 * needed for proper display of the message
 * @param {Object} msg Event data
 * @return {Array<String>} Arguments needed
 */
Torus.ext.cmd.find_args = (msg) => {
	switch(msg.event) {
		case 'me':
		case 'message': 	return [msg.user, msg.text];
		case 'alert':		return [msg.text];
		case 'update_user': return [msg.user, msg.room.userlist[msg.user].status_state, msg.room.userlist[msg.user].status_message];
		case 'join':
		case 'rejoin':
		case 'ghost':
		case 'part':
		case 'logout':		return [msg.user, msg.room.name];
		case 'ctcp':		return [msg.user === Torus.user.name ? '>' : '<', msg.user, msg.target, msg.proto, msg.data ? ': ' + msg.data : ''];
		case 'mod':
		case 'kick':
		case 'unban':		return [msg.performer, msg.target];
		case 'ban':			return [msg.performer, msg.target, msg.expiry];
		case 'error':		return [msg.error, JSON.stringify(msg.args)];
		default: 			throw new Error(`Message type ${msg.event} can't be printed. (cmd.parse_message)`);
	}
};

/**
 * Called after the window loads, and basically sends the
 * intro message into the console
 */
Torus.ext.cmd.onload = () => {
	console.info(Torus.i18n.text('cmd-welcome', Torus.get_version()));
	for(var chat in Torus.chats) {
		Torus.ext.cmd.setup_room(Torus.chats[chat]);
	}
};

Torus.add_listener('chat', 'new', Torus.ext.cmd.new_room);
Torus.ext.cmd.add_onload_listener(Torus.ext.cmd.onload);
