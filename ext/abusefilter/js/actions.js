/**
 * actions.js
 *
 * Module containing available actions for abuse filter
 */

Torus.ext.abusefilter.actions.enabled = Torus.util.null;

/**
 * Makes a ping when triggered
 * @param {Object} event Event that triggered the action
 * @todo Make extension-dependent
 */
Torus.ext.abusefilter.actions.ping = function(event) {
	event.ping = true;
	if(event.html && event.html.parentNode) {
		event.html.parentNode.classList.add('torus-message-ping');
	}
	Torus.ui.ping(event.room);
};

/**
 * Warns the triggering user.
 * @param {Object} event Event that triggered the action
 * @param {Object} params Action parameters
 */
Torus.ext.abusefilter.actions.warn = function(event, params) {
	if(params.message) {
		event.room.send_message(params.message);
	}
};

/**
 * Kicks the triggering user.
 * @param {Object} event Event that triggered the action
 */
Torus.ext.abusefilter.actions.kick = function(event) {
	event.room.kick(event.user);
};

/**
 * Bans the triggering user.
 * @param {Object} event Event that triggered the action
 */
Torus.ext.abusefilter.actions.ban = function(event, params) {
	event.room.ban(event.user, params.expiry, params.reason);
};

/**
 * Blocks and kicks the triggering user.
 * @param {Object} event Event that triggered the action
 * @todo move block api call to io?
 * @todo error handling
 */
Torus.ext.abusefilter.actions.block = function(event, params) {
	delete params.enabled;
	Torus.io.api('POST', 'action', Torus.util.softmerge({
		user: event.user,
		token: Torus.user.token
	}, params), () => {
	    event.room.kick(event.user);
	}, (e) => {
		console.error(e);
	    // TODO: Error handling
	});
};
