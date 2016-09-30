Torus.ui.new_room = (event) => {
	if(!(event.room.parent || event.room.id === 0) && !Torus.user.data.pings[event.room.domain]) {
		Torus.user.data.pings[event.room.domain] = {};
		for(var i in Torus.user.data.pings['#global']) {
			if(Torus.user.data.pings['#global'].hasOwnProperty(i)) {
				Torus.user.data.pings[event.room.domain][i] = Torus.user.data.pings['#global'][i];
			}
		}
		Torus.user.data.pings[event.room.domain].enabled = true;
		Torus.user.data.pings[event.room.domain].notification = true;
		Torus.user.data.pings[event.room.domain].literal = [];
		Torus.user.data.pings[event.room.domain].regex = [];
		Torus.ui.pings.rebuild();
	}

	for(var i in Torus.logs) {
		if(Torus.logs.hasOwnProperty(i) && !Torus.logs[i][event.room.domain]) {
			Torus.logs[i][event.room.domain] = [];
		}
	}

	event.room.listeners.ui = {};

	event.room.last_viewed = 0;

	if(isNaN(event.room.domain * 1)) {
		event.room.emotes = {};
		Torus.io.api('GET', 'query', {
		    meta: 'allmessages',
			ammessages: 'Emoticons'
		}, (d) => {
		    event.room.emotes = Torus.util.parse_emotes(d.query.allmessages[0]['*']);
		}, (e) => { //jshint ignore:line
		    // TODO: Error handling
		});
		event.room.checkuser = false;
		Torus.user.get_info(event.room.domain, () => {
			if(Torus.user.rights[event.room.domain].includes('checkuser')) {
				event.room.checkuser = true;
				// TODO: Load CCUI
			}
			// TODO: Load AbuseFilter
		});
	}
};

Torus.ui.add_room = function(event) {
	if(event.room.id !== 0) {
		Torus.alert(Torus.i18n.text('connecting', '{' + event.room.name + '}'));
	}

	for(var i = 0; i < Torus.ui.ids.tabs.children.length; ++i) {
		if(Torus.ui.ids.tabs.children[i].getAttribute('data-id') === event.room.domain) {
			return;
		}
	}

	var tab = document.createElement('span');
	tab.id = 'torus-tab-' + event.room.domain;
	Torus.ui.ids['tab-' + event.room.domain] = tab;
	tab.setAttribute('data-id', event.room.domain);
	tab.className = 'torus-tab';
	tab.addEventListener('click', Torus.ui.tab_click);
	tab.textContent = event.room.id === 0 ? Torus.i18n.text('status') : event.room.name;
	if(event.room.id > 0) {
		var x = document.createElement('span');
		x.className = 'torus-tab-close';
		x.addEventListener('click', function(event) {
			event.stopPropagation();
			Torus.ui.remove_room(Torus.chats[this.parentNode.getAttribute('data-id')]);
		});
		x.textContent = 'x';
		tab.appendChild(x);
	}
	Torus.ui.ids.tabs.appendChild(tab);

	if(!event.room.parent) {Torus.ui.activate(event.room);}
};

Torus.ui.remove_room = (room) => {
	if(room.connecting || room.connected) {
		room.disconnect('closed');
	}

	if(room === Torus.ui.active) {
		Torus.ui.activate(room.parent ? room.parent : Torus.chats[0]); // FIXME: activate the next chat tab to the left
	}
	if(room.viewing) {
		Torus.ui.show(room);
	}

	Torus.ui.ids.tabs.removeChild(Torus.ui.ids['tab-' + room.domain]);
	delete Torus.ui.ids['tab-' + room.domain];
};
Torus.ui.room_disconnect = (event) => {
	if(Torus.ui.active === event.room) {
		Torus.util.empty(Torus.ui.ids.sidebar);
	}
	Torus.alert(Torus.i18n.text('disconnected', event.room.name, Torus.i18n.text('disconnected-' + event.reason))); //FIXME: add reconnect link
};

Torus.ui.add_line = (event) => {
	if(typeof event.text === 'string' && !event.html) {
		Torus.ui.parse_message(event);
	}

	Torus.logs.messages[event.room.domain].push(event);
	//Torus.logs.plain[event.room.domain].push(event); //TODO: this is supposed to be like just text right?

	if(event.room === Torus.ui.active || (event.room.viewing && Torus.ui.active.id > 0)) {
		var scroll = false;
		scroll = (Torus.ui.ids.window.offsetHeight + Torus.ui.ids.window.scrollTop >= Torus.ui.ids.window.scrollHeight);
		Torus.ui.ids.window.appendChild(Torus.ui.render_line(event));
		if(scroll) {
			Torus.ui.ids.window.scrollTop = Torus.ui.ids.window.scrollHeight;
		}

		if(Torus.user.data.options.maxmessages !== 0 && Torus.ui.ids.window.children.length > Torus.user.data.options.maxmessages) {
			Torus.ui.ids.window.removeChild(Torus.ui.ids.window.children[0]);
		}
	} else {
		if(event.event === 'message' || event.event === 'me') {
			Torus.ui.ids['tab-' + event.room.domain].classList.add('torus-tab-message');
			if(event.room.parent) {
				Torus.ui.ping(event);
			}
		} else {
			Torus.ui.ids['tab-' + event.room.domain].classList.add('torus-tab-alert');
		}

	}
};

Torus.ui.update_user = (event) => {
	if(event.room !== Torus.ui.active) {
		return;
	}

	var props = event.room.userlist[event.user],
		userlist = Torus.ui.ids.sidebar.getElementsByTagName('li'),
		li = false,
		modstaff = props.staff ? 'staff' : props.mod ? 'mod' : false;
	for(var i = 0; i < userlist.length; ++i) { //check if we're adding a new li or modifying an existing one
		if(userlist[i].className.includes('torus-user-' + encodeURIComponent(event.user))) {
			li = userlist[i];
			break;
		}
	}
	if(!li) {
		li = Torus.util.create_element({
			type: 'li',
			data: { user: event.user },
			mouseover: function() { // FIXME: hardcoded function
				Torus.ui.popup.render(this.getAttribute('data-user'), Torus.ui.active);
			}
		});
		var sidebar = Torus.ui.ids.sidebar,
			added = false;
		for(var i = 0; i < sidebar.children.length; ++i) {
			var el = sidebar.children[i],
				child = event.room.userlist[el.getAttribute('data-user')];
			if(!added && !((!props.staff && child.staff) || (!props.mod && child.mod)) && ((props.staff && !child.staff) || (props.mod && !child.mod) || Torus.util.compare_strings(event.user, sidebar.children[i].getAttribute('data-user')) < 0)) { // FIXME: wtf Monch
				sidebar.insertBefore(li, el);
				added = true;
			}
		}
		if(!added) {
			sidebar.appendChild(li); // is at the end of the alphabet
		}
	}

	while(li.firstChild) {
		li.removeChild(li.firstChild);
	}

	li.className = 'torus-user torus-user-' + encodeURIComponent(event.user);
	if(modstaff) {
		li.classList.add('torus-user-' + modstaff);
		li.appendChild(Torus.util.create_element({
			type: 'img',
			class: 'user-icon-' + modstaff,
			src: 'img/' + modstaff + '-icon.png'
		}));
	}
	li.appendChild(document.createTextNode(String.fromCharCode(160))); // &nbsp;

	var span = Torus.util.create_element({
		type: 'span',
		class: 'torus-user-name',
		text: event.user
	});
	if(props.status_state.toLowerCase() === 'away') {
		span.classList.add('torus-user-away');
	}
	li.appendChild(span);
};

Torus.ui.remove_user = (event) => {
	if(event.room !== Torus.ui.active) {
		return;
	}

	var userlist = Torus.ui.ids.sidebar.getElementsByTagName('li');
	for(var i = 0; i < userlist.length; ++i) {
		var el = userlist[i];
		if(el.className.includes('torus-user-' + encodeURIComponent(event.user))) {
			el.parentNode.removeChild(el);
			return;
		}
	}
};

Torus.ui.initial = (event) => {
	for(var i = 0; i < event.messages.length; i++) {
		Torus.ui.parse_message(event.messages[i]);

		var log = Torus.logs.messages[event.room.domain];
		if(log.length === 0) {
			log.push(event.messages[i]);
		} else {
			var added = false;
			for(var j = log.length - 1; j >= 0; j--) {
				if(event.messages[i].id > log[j].id) {
					log.splice(j + 1, 0, event.messages[i]);
					added = true;
					break;
				} else if(event.messages[i].id === log[j].id) {
					log[j] = event.messages[i];
					added = true;
					break;
				}
			}
			if(!added) {
				log.unshift(event.messages[i]);
			}
		}
	}
	event.users.forEach((el) => {
		Torus.ui.update_user(el);
	});
	if(event.room === Torus.ui.active) {
		Torus.util.empty(Torus.ui.ids.window);
		Torus.ui.render(Torus.ui.ids.window);
	}

	if(event.room.parent && event.room !== Torus.ui.active) {
		Torus.ui.ping(event);
	}
};

Torus.ui.parse_message = (event) => {
	if(!event.ping && event.user !== Torus.user.name && !event.room.parent && event.room !== Torus.chats[0] && Torus.user.data.pings['#global'].enabled) {
		event.ping = false;
		var text = event.text.toLowerCase(),
			global = Torus.user.data.pings['#global'],
			local = Torus.user.data.pings[event.room.domain],
			i;

		for(i = 0; i < global.literal.length; ++i) {
			if(text.includes(global.literal[i])) {
				event.ping = true;
				break;
			}
		}
		for(i = 0; i < global.regex.length; ++i) {
			var el = global.regex[i],
				test = el.test(text);
			el.lastIndex = 0;
			if(test) {
				event.ping = true;
				break;
			}
		}
		if(local.enabled && !event.ping) {
			for(i = 0; i < local.literal.length; ++i) {
				if(text.includes(local.literal[i])) {
					event.ping = true;
					break;
				}
			}
			for(i = 0; i < local.regex.length; ++i) {
				var el = local.regex[i],
					test = el.test(text);
				el.lastIndex = 0;
				if(test) {
					event.ping = true;
					break;
				}
			}
		}
	}

	if(event.ping) {
		Torus.ui.ping(event);
	}

	var hooks = {},
		room = event.room.parent ? event.room.parent : event.room;
	if(Torus.user.data.options.showemotes) {
		var emotes = room.emotes;
		for(var i in emotes) {
			if(emotes.hasOwnProperty(i)) {
				hooks[i] = Torus.ui.parser.parse_emote;
			}
		}
	}

	event.html = Torus.ui.parse_links(event.text, room.domain, hooks);
};

Torus.add_listener('chat', 'new', Torus.ui.new_room);
Torus.add_listener('chat', 'open', Torus.ui.add_room);
Torus.add_listener('chat', 'close', Torus.ui.room_disconnect);

Torus.add_listener('io', 'initial', Torus.ui.initial);

Torus.add_listener('io', 'join', Torus.ui.update_user);
Torus.add_listener('io', 'update_user', Torus.ui.update_user);
Torus.add_listener('io', 'part', Torus.ui.remove_user);
Torus.add_listener('io', 'logout', Torus.ui.remove_user);
Torus.add_listener('io', 'ghost', Torus.ui.remove_user);

Torus.add_listener('io', 'alert', Torus.ui.add_line);
Torus.add_listener('io', 'message', Torus.ui.add_line);
Torus.add_listener('io', 'me', Torus.ui.add_line);
Torus.add_listener('io', 'join', Torus.ui.add_line);
Torus.add_listener('io', 'part', Torus.ui.add_line);
Torus.add_listener('io', 'logout', Torus.ui.add_line);
Torus.add_listener('io', 'ghost', Torus.ui.add_line);
Torus.add_listener('io', 'ctcp', Torus.ui.add_line);
Torus.add_listener('io', 'mod', Torus.ui.add_line);
Torus.add_listener('io', 'kick', Torus.ui.add_line);
Torus.add_listener('io', 'ban', Torus.ui.add_line);
Torus.add_listener('io', 'unban', Torus.ui.add_line);
Torus.add_listener('io', 'error', Torus.ui.add_line);
