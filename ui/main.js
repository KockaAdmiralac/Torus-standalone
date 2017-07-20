
class UI extends Torus.classes.Extension {
	static initialize() {
		Torus.call_listeners(new Torus.classes.WindowEvent('load'));
		window.addEventListener('beforeunload', Torus.unload);
		UI.initIDs();
		UI.initListeners();
		document.title = Torus.i18n.text('title');
		UI.active = Torus.chats[0];
		UI.viewing = [];
		UI.popup = require('./popup.js');
	}
	static initIDs() {
		UI.ids = {};
		UI.window = Torus.ui.ids.torus = document.getElementById('torus');
		['tabs', 'sidebar', 'tab--1', 'popup', 'window', 'input', 'input-box', 'info', 'menu-text'].forEach(function(el) {
			Torus.ui.ids[el] = document.getElementById('torus-' + el);
		});
	}
	static initListeners() {
		// TODO: I did this in haste, I should probably make it more readable
		UI.ids['input-box'].addEventListener('keydown', Torus.ui.input);
		UI.ids.torus.addEventListener('mouseover', Torus.ui.window_mouseover);
		UI.ids['tab--1'].addEventListener('click', Torus.ui.menu.tab_click);
		UI.ids.sidebar.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		UI.ids.sidebar.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
		UI.ids.popup.addEventListener('mouseover', Torus.ui.sidebar_mouseover);
		UI.ids.popup.addEventListener('mouseout', Torus.ui.sidebar_mouseout);
		UI.ids['menu-text'].innerHTML = String.fromCharCode(160) + Torus.i18n.text('menu-menu');
		UI.window.addEventListener('mouseover', Torus.ui.window_mouseover);
	}
	static onload() {
		document.body.appendChild(UI.window);
		Torus.ext.options.rebuild();
		Torus.ui.pings.rebuild();
		for(let i in Torus.logs) {
			if(Torus.logs.hasOwnProperty(i)) {
				Torus.logs[i][0] = [];
			}
		}
		Torus.chats[0].listeners.ui = {};
		Torus.ui.add_room({room: Torus.chats[0]});
		Torus.ui.show(Torus.chats[0]);
		if(!Torus.user.token) {
			Torus.chats.alert(Torus.i18n.text('enter-username'));
		} else {
			Torus.ui.join_defaultrooms();
		}
	}
	static join_defaultrooms() {
		if(Torus.user.data.options.defaultrooms) {
			Torus.user.data.options.defaultrooms.forEach((el) => {
				if(!Torus.chats[el]) {
					Torus.open(el);
				}
			});
		}
	}
}

Torus.ui.join_defaultrooms = () => {

};
