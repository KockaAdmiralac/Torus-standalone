/**
 * activate.js
 * Contains methods for updating the UI when a room gets switched
 */

/**
 * Sets the time of the last viewing on rooms
 */
Torus.ui.view = () => {
	var time = (new Date()).getTime();
	if(Torus.ui.active.id >= 0) {
		Torus.ui.active.last_viewed = time;
	}
	Torus.ui.viewing.forEach((el) => {
		el.last_viewed = time;
	});
};

/**
 * Activates a room
 * @param {unknown} room The room that gets activated
 */
Torus.ui.activate = (room) => {
	if(Torus.ui.active) {
		Torus.ui.ids['tab-' + (Torus.ui.active.id >= 0 ? Torus.ui.active.domain : '-1')].classList.remove('torus-tab-active');
		Torus.ui.view();
		Torus.util.empty(Torus.ui.ids.info);
		var event = new Torus.classes.UIEvent('deactivate', Torus.ui.active);
		event.old_window = Torus.util.empty(Torus.ui.ids.window);
		event.old_sidebar = Torus.util.empty(Torus.ui.ids.sidebar);
		Torus.call_listeners(event);
	}
	Torus.ui.active = room;

	if(room.id >= 0) {
		var tab = Torus.ui.ids['tab-' + room.domain];
		tab.classList.add('torus-tab-active');
		tab.classList.remove('torus-tab-ping');
		tab.classList.remove('torus-tab-message');
		tab.classList.remove('torus-tab-alert');
	} else {
		Torus.ui.ids['tab--1'].classList.add('torus-tab-active');
	}

	var link = document.createElement('a');
	if(room.id > 0) { // chat
		link.addEventListener('click', Torus.ui.click_link);
		if(!room.parent) {
			link.href = Torus.util.wikilink(room.domain);
			link.textContent = room.domain;
			Torus.ui.ids.info.appendChild(Torus.i18n.html('info-public', link));
		} else {
			link.href = Torus.util.wikilink(room.parent.domain);
			link.textContent = room.parent.domain;
			Torus.ui.ids.info.appendChild(Torus.i18n.html('info-private', link, document.createTextNode(room.priv_users.slice(0, room.priv_users.length - 1).join(', ') + ' ' + Torus.i18n.text('and') + ' ' + room.priv_users[room.priv_users.length - 1])));
		}
	} else if(room.id !== 0 || room.id !== -1) { // extension
		link.className = 'torus-fakelink';
		link.textContent = '------- ' + Torus.i18n.text('info-menu-back') + ' -------';
		link.addEventListener('click', Torus.ui.menu.tab_click);
		Torus.ui.ids.info.appendChild(link);
	}
	if(room.id >= 0) {
		Torus.ui.render(Torus.ui.ids.window);
	}
	Torus.call_listeners(new Torus.classes.UIEvent('activate', room));
};

/**
 * Shows a room specified
 * @param {unknown} room The room to show
 */
Torus.ui.show = (room) => {
	if(room.id < 0) {
		throw new Error('Invalid room ' + room.domain + '. (ui.show)');
	}

	Torus.ui.view();

	if(room.viewing) { // unshow
		room.viewing = false;
		for(var i = 0; i < Torus.ui.viewing.length; i++) {
			if(Torus.ui.viewing[i] === room) {
				Torus.ui.viewing.splice(i, 1);
			}
		}

		var tab = Torus.ui.ids['tab-' + room.domain];
		tab.classList.remove('torus-tab-viewing');

		Torus.util.empty(Torus.ui.ids.window);
		Torus.ui.render(Torus.ui.ids.window);
		Torus.call_listeners(new Torus.classes.UIEvent('unshow', room));
	} else { // show
		room.viewing = true;
		Torus.ui.viewing.push(room);

		Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-viewing');

		Torus.util.empty(Torus.ui.ids.window);
		Torus.ui.render(Torus.ui.ids.window);
		Torus.call_listeners(new Torus.classes.UIEvent('show', room));
	}
};
