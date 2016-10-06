/**
 * main.js
 *
 * Main file of the `logs` extension
 * This is basically a `cmd` extension but with different possibilities
 */

/**
 * Passes the room to setup_room when a new room gets created
 * @param {Event} event Event sent in the room
 */
Torus.ext.logs.new_room = (event) => {
	Torus.ext.logs.setup_room(event.room);
};

/**
 * Sets up room listeners
 * @param {Torus.classes.Chat} room Room to set up
 */
Torus.ext.logs.setup_room = (room) => {
    [
		'message', 'me', 'join', 'part', 'logout', 'ghost', 'ctcp', 'mod',
        'kick', 'ban', 'unban'
	].forEach(function(el) {
		room.add_listener('io', el, Torus.ext.logs.log_message);
	});
};

/**
 * Handles events happening in rooms and logs them in console
 * @param {Object} message Event data
 */
Torus.ext.logs.log_message = (message) => {
	if(message.type !== 'io') {
		throw new Error('Event type must be \'io\' (ext.logs.log_message)');
	}
    let msg = Torus.i18n.text.apply(Torus, [`logs-${message.event}`].concat(Torus.ext.logs.find_args(message))),
        ts = Torus.util.timestamp(message.time, Torus.user.data.options.timezone, true),
        filename;
    if(message.room.parent) {
        // TODO: What if we change "PM: " to something else?
        let name = message.room.name.substring(4);
        // Escaping username characters
        // TODO: Some better replacement???
        name
            .replace(/\*/g, '%2A')
            .replace(/\?/g, '%3F')
            .replace(/"/g,  '%22')
            .replace(/\\/g, '%5C');
        filename = `pms/${name}`;
    } else {
        filename = message.room.name;
    }
    // TODO: Don't just replace newlines with spaces, jeez
    Torus.fs.appendFile(`${__dirname}/logs/${filename}.txt`, `\n[${ts}] ${msg.replace(/\n/g, ' ')}`);
};

/**
 * Determines the message type and returns the respective arguments
 * needed for proper display of the message
 * @param {Object} msg Event data
 * @return {Array<String>} Arguments needed
 */
Torus.ext.logs.find_args = (msg) => {
	switch(msg.event) {
		case 'me':
		case 'message': 	return [msg.user, msg.text];
		case 'join':
		case 'rejoin':
		case 'ghost':
		case 'part':
		case 'logout':		return [msg.user];
		case 'ctcp':		return [msg.user === Torus.user.name ? '>' : '<', msg.user, msg.target, msg.proto, msg.data ? ': ' + msg.data : ''];
		case 'mod':
		case 'kick':
		case 'unban':		return [msg.performer, msg.target];
		case 'ban':			return [msg.performer, msg.target, msg.expiry];
	}
};

/**
 * Called after the window loads
 */
Torus.ext.logs.onload = () => {
    // Making required directories
    Torus.util.mkdir('logs', () => {
        Torus.util.mkdir('logs/pms', () => {
            // Setting up handlers for open chats
            for(var chat in Torus.chats) {
                if(Torus.chats.hasOwnProperty(chat)) {
                    Torus.ext.logs.setup_room(Torus.chats[chat]);
                }
            }
        });
    });

};

Torus.add_listener('chat', 'new', Torus.ext.logs.new_room);
Torus.ext.logs.add_onload_listener(Torus.ext.logs.onload);
