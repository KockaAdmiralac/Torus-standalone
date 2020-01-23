new Torus.classes.Extension('ui', true);

Torus.ui = {
	ids: {},
	active: Torus.chats[0],
	viewing: [],
	popup_timeout: 0,
	popup: {}
};

Torus.ui.onload = () => {
	Torus.ui.window = Torus.ui.ids.torus = document.getElementById('torus');
	['tabs', 'sidebar', 'tab--1', 'popup', 'window', 'input', 'input-box', 'info', 'menu-text'].forEach((el) => {
		Torus.ui.ids[el] = document.getElementById('torus-' + el);
	});
	// TODO: I did this in haste, I should probably make it more readable
	Torus.ui.ids['input-box'].addEventListener('keydown', Torus.ui.input);
	Torus.ui.ids.torus.addEventListener('mouseover', Torus.ui.window_mouseover);
	Torus.ui.ids['tab--1'].addEventListener('click', Torus.ui.menu.tab_click);
	Torus.ui.ids.sidebar.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
	Torus.ui.ids.sidebar.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.ids.popup.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
	Torus.ui.ids.popup.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
	Torus.ui.ids['menu-text'].innerHTML = String.fromCharCode(160) + Torus.i18n.text('menu-menu');
	Torus.ui.window.addEventListener('mouseover', Torus.ui.window_mouseover);
	document.title = Torus.i18n.text('title');
	document.body.appendChild(Torus.ui.window);
	Torus.ext.options.rebuild();
	Torus.ui.pings.rebuild();
	for(var i in Torus.logs) {
		if(Torus.logs.hasOwnProperty(i)) {
			Torus.logs[i][0] = [];
		}
	}
	Torus.chats[0].listeners.ui = {};
	Torus.ui.add_room({room: Torus.chats[0]});
	Torus.ui.show(Torus.chats[0]);
	if(!Torus.user.token) {
		Torus.alert(Torus.i18n.text('enter-username'));
	} else {
		Torus.ui.join_defaultrooms();
	}
};

Torus.ui.join_defaultrooms = () => {
	if(Torus.user.data.options.defaultrooms) {
		Torus.user.data.options.defaultrooms.forEach((el) => {
			if(!Torus.chats[el]) {
				Torus.open(el);
			}
		});
	}
};
