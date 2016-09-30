Torus.ext.abusefilter.ui = {};
Torus.ext.abusefilter.selected = 'filter';
Torus.ext.abusefilter.actions = {};
Torus.ext.abusefilter.params = Torus.files.abusefilter_params;
Torus.ext.abusefilter.filter = false;
Torus.ext.abusefilter.filter_text = '';

Torus.ext.abusefilter.message_vars = function(message) {
 		let room = message.room,
			user = room.userlist[message.user],
			ret = {
		event: message.event,

		message_time: message.time,

		user_name: message.user,
		user_mod: user.mod,
		user_givemod: user.givemod,
		user_staff: user.staff,
		user_edits: user.edits,
		user_avatar: user.avatar,
		user_status: user.status_state,
		user_status_message: user.status_message,

		room_name: room.name,
		room_domain: room.domain,
		room_size: room.users,
		room_id: room.id,
	};
	ret.message_text = message.text || '';
	ret.message_html = message.html.innerHTML || '';
	ret.message_ping = message.ping;
	return ret;
};
