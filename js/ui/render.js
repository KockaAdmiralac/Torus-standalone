// HACK: Blocks users from pinging you
Torus.getthefuckoutofmychat = [
];

// HACK: Pings you thrice wherever these users do something
Torus.holyshit = [
];

Torus.ui.render = function(el) {
	if(!el) {
		el = Torus.ui.ids.window;
	}
	var rooms = [],
		indexes = [],
		active = false,
		bar = false,
		frag = document.createDocumentFragment();
	if(Torus.ui.active !== Torus.chats[0]) {
		Torus.ui.viewing.forEach(function(el) {
			active = (el === Torus.ui.active);
			var log = Torus.logs.messages[el.domain];
			if(log.length > 0) {
				rooms.push(log);
				indexes.push(log.length - 1);
			}
		});
	}
	var log = Torus.logs.messages[Torus.ui.active.domain];
	if(!active && log.length > 0) {
		rooms.push(log);
		indexes.push(log.length - 1);
	}
	for(var i = 0; (Torus.user.data.options.maxmessages === 0 || i < Torus.user.data.options.maxmessages) && rooms.length > 0; ++i) {
		var message = rooms[0][indexes[0]],
			source = 0;
		for(var j = 1; j < rooms.length; ++j) {
			if(rooms[j][indexes[j]].id > message.id) {
				message = rooms[j][indexes[j]];
				source = j;
			}
		}
		--indexes[source];
		if(indexes[source] === -1) { //no more messages
			rooms.splice(source, 1);
			indexes.splice(source, 1);
		}

		if(!bar && message.id < Torus.ui.active.last_viewed) {
			var hr = Torus.util.create_element({ type: 'hr', class: 'message-separator' });
			if(frag.children.length === 0) {
				frag.appendChild(hr);
			} else {
				frag.insertBefore(hr, frag.firstChild);
			}
			bar = true;
		}
		if(frag.children.length === 0) {
			frag.appendChild(Torus.ui.render_line(message));
		} else {
			frag.insertBefore(Torus.ui.render_line(message), frag.firstChild);
		}
	}
	el.appendChild(frag);

	// rerender userlist
	// FIXME: now that this is a generalized function, should we still do this or move it somewhere else?
	if(Torus.ui.active.id > 0) {
		//FIXME: this is really hacky
		var e = {room: Torus.ui.active};
		for(var i in Torus.ui.active.userlist) {
			e.user = i;
			Torus.ui.update_user(e);
		}
	}

	el.scrollTop = el.scrollHeight;

	var event = new Torus.classes.UIEvent('render');
	event.target = el;
	Torus.call_listeners(event);
};

Torus.ui.render_line = function(message) {
	if(message.type !== 'io') {
		throw new Error('Torus.ui.render_line: Event type must be `io`.');
	}

	var viewing = Torus.ui.viewing.length,
		children = [];
	if(Torus.ui.viewing.includes(Torus.chats[0])) {
		--viewing;
	}
	if(Torus.ui.viewing.includes(Torus.ui.active)) {
		--viewing;
	}
	children.push({
		type: 'span',
		class: 'message-timestamp',
		text: '[' + Torus.util.timestamp(message.time, Torus.user.data.options.ui_timezone) + ']'
	});
	if(viewing > 0) {
		var max = message.room.name.length;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(max < Torus.ui.viewing[i].name.length) {max = Torus.ui.viewing[i].name.length;}
		}
		if(max < Torus.ui.active.name.length) {max = Torus.ui.active.name.length;}
		max -= message.room.name.length;
		var indent = '';
		for(var i = 0; i < max; ++i) {
			indent += ' ';
		}
		children = children.concat([' ',
			{
				type: 'span',
				class: 'message-room',
				text: '{' + message.room.name + '}'
			},
			{
				type: 'span',
				class: 'whitespace',
				text: indent
			},
			' '
		]);
	}
	children.push(' ');
	var html,
		whitespace = {
			type: 'span',			// this is arguably one of the dumber things i've ever done
			class: 'whitespace',	// it works though
			text: ' '				// #yolo
		};
	switch(message.event) {
		case 'me':
		case 'message':
			children = children.concat((message.event === 'message') ?
				[ whitespace, '<', Torus.ui.span_user(message.user), '> ' ] :
				[ '*', whitespace, Torus.ui.span_user(message.user), ' ' ]
			);
			let blocked = document.createElement('span');
			blocked.style.color = '#CCCCCC';
			blocked.innerHTML = 'Message blocked';
			html = (Torus.getthefuckoutofmychat.includes(message.user)) ? blocked : message.html;
			break;
		case 'alert':
			children.push('== ');
			html = message.html;
			break;
		case 'join':
		case 'rejoin':
		case 'ghost':
		case 'part':
			if(Torus.holyshit.includes(message.user)) {
				var audio = new Audio('audio/ping.ogg');
				audio.play();
				audio.play();
				audio.play();
				new Notification('HOLY SHIT');
			}
			children.push('== ');
			html = Torus.i18n.html(`message-${message.event}`, Torus.util.create_element(Torus.ui.span_user(message.user)), document.createTextNode(`{${message.room.name}}`));
			break;
		case 'logout':
			children.push('== ');
			html = Torus.i18n.html('message-logout', Torus.util.create_element(Torus.ui.span_user(message.user)));
			break;
		case 'ctcp':
			children = children.concat(
				[
					(message.user === Torus.user.name) ? ' >' : ' <', whitespace,
					Torus.ui.span_user(message.user),
					` CTCP|${message.target}|${message.proto}${message.data ? (': ' + message.data) : ''}`
				]
			);
			break;
		case 'mod':
			children.push('== ');
			html = Torus.i18n.html('message-mod', Torus.util.create_element(Torus.ui.span_user(message.performer)), Torus.util.create_element(Torus.ui.span_user(message.target)), document.createTextNode(`{${message.room.name}}`));
			break;
		case 'kick':
		case 'ban':
		case 'unban':
			var domain = message.room.parent ?
				message.room.parent.domain :
				message.room.domain,
				subchildren = [
					Torus.ui.span_user(message.target), ' (',
					{
						type: 'a',
						href: Torus.util.wikilink(domain, 'User_talk:' + message.target),
						text: Torus.i18n.text('message-banlinks-talk'),
						click: Torus.ui.click_link
					}, '|',
					{
						type: 'a',
						href: Torus.util.wikilink(domain, 'Special:Contributions/' + message.target),
						text: Torus.i18n.text('message-banlinks-contribs'),
						click: Torus.ui.click_link
					}, '|',
					{
						type: 'a',
						href: Torus.util.wikilink(domain, 'Special:Log/chatban', { page: 'User:' + message.target }),
						text: Torus.i18n.text('message-banlinks-history'),
						click: Torus.ui.click_link
					}
				];
			if(message.room.checkuser) {
				subchildren = subchildren.concat([
					'|',
					{
						type: 'a',
						href: Torus.util.wikilink(domain, 'Special:Log/chatconnect', { user: message.target }),
						text: Torus.i18n.text('message-banlinks-chatconnect'),
						click: Torus.ui.click_link
					}
				]);
			}
			subchildren.push(')');
			children.push('== ');
			html = Torus.i18n.html(
				`message-${message.event}`,
				Torus.util.create_element(Torus.ui.span_user(message.performer)),
				document.createTextNode(message.target),
				document.createTextNode(`{${message.room.name}}`),
				document.createTextNode(message.expiry)
			);
			break;
		case 'error':
			var args = [message.error];
			args = args.concat(message.args);
			children.push('== ' + Torus.i18n.text.apply(Torus, args));
			break;
		default: throw new Error('Message type ' + message.event + ' is not rendered. (ui.render_line)');
	}
	var line = Torus.util.create_element({
		type: 'div',
		classes: ['message', 'room-' + message.room.domain],
		children: children
	});
	if(html) {
		line.appendChild(html);
	}
	if(message.ping) {
		line.classList.add('torus-message-ping');
	}
	if(message.room !== Torus.ui.active) {
		line.classList.add('torus-message-inactive');
	}
	return line;
};
