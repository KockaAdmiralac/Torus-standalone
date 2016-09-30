Torus.ui.input = function(event) {
	if(event.keyCode === 13 && !event.shiftKey) { // enter
		event.preventDefault();
		if(Torus.data.history[1] !== this.value) {
			Torus.data.history[0] = this.value;
			Torus.data.history.unshift('');
		}
		Torus.data.histindex = 0;

		Torus.call_listeners(new Torus.classes.UIEvent('beforesend'));

		// Empty field
		if(!this.value) {
			return;
		}
		if(Torus.ui.active.id > 0) {
			// Escaping messages with ./ or // or \/ in front
			if(this.value.indexOf('./') === 0 || this.value.indexOf('//') === 0 || this.value.indexOf('\\/') === 0) {
				Torus.ui.active.send_message(this.value.substring(1));
			} else if(Torus.ui.active.connected) {
				Torus.ui.active.send_message(this.value);
			}
			this.value = '';
		} else if(!Torus.user.token) { // Logging in
			if(Torus.user.name) {
				Torus.alert(Torus.i18n.text('attempting-login'));
				Torus.user.login(Torus.user.name, this.value);
				this.value = '';
				this.classList.remove('password');
			} else {
				Torus.alert(Torus.i18n.text('enter-password'));
				Torus.user.name = this.value;
				this.value = '';
				this.classList.add('password');
			}
		}
	} else if(event.keyCode === 9 && Torus.ui.active.id > 0) { // tab
		event.preventDefault();
		if(!Torus.data.tabtext) {
			var str = this.value;
			while(str[str - 1] === ' ') {
				str = str.substring(0, str.length - 1);
			}
			Torus.data.tabpos = str.lastIndexOf(' ') + 1;
			Torus.data.tabtext = str.substring(Torus.data.tabpos);
		}
		var matches = 0;
		for(var user in Torus.ui.active.userlist) {
			if(Torus.ui.active.userlist.hasOwnProperty(user)) {
				if(user.indexOf(Torus.data.tabtext) === 0) {
					if(++matches > Torus.data.tabindex) {
						break;
					}
				}
			}
		}
		if(matches <= Torus.data.tabindex) {
			user = Torus.data.tabtext;
			Torus.data.tabindex = 0;
		} else {
			Torus.data.tabindex++;
		}
		this.value = Torus.data.tabpos === 0 ?
			(user + (Torus.data.tabindex === 0 ? '' : ': ')) :
			(this.value.substring(0, Torus.data.tabpos) + user);
	} else if(event.keyCode === 38 && Torus.data.histindex + 1 < Torus.data.history.length && Torus.ui.active.id > 0) { // up
		Torus.data.histindex++;
		this.value = Torus.data.history[Torus.data.histindex];
	} else if(event.keyCode === 40 && Torus.data.histindex > 0 && Torus.ui.active.id > 0) { // down
		Torus.data.histindex--;
		this.value = Torus.data.history[Torus.data.histindex];
	} else if(event.keyCode !== 39 && event.keyCode !== 41 && Torus.ui.active.id > 0) { // anything other than left or right
		Torus.data.tabtext = '';
		Torus.data.tabindex = 0;
		Torus.data.tabpos = 0;
	}
};

Torus.ui.click_link = function(event) {
	if(!this.href) {
		console.log('Torus.ui.click_link called on something with no href: ', this);
		return;
	}
	event.preventDefault();

	if(
		(
			this.href.includes('.wikia.com/wiki/Special:Chat') ||
			this.href.includes('.wikia.com/wiki/Special:Torus')
		) &&
		Torus.user.data.options.ui_joinchatlinks
	) {
		Torus.open(this.href.substring(this.href.indexOf('://') + 3, this.href.indexOf('.wikia.com/wiki/Special:')));
	} else {
		Torus.shell.openExternal(this.href);
	}
};

Torus.ui.tab_click = function(event) {
	event.preventDefault();
	var room = Torus.chats[this.getAttribute('data-id')];
	if(event.shiftKey) {
		document.getSelection().removeAllRanges();
		if(Torus.ui.active.domain !== room) {
			Torus.ui.show(room);
		}
	} else {
		Torus.ui.activate(room);
	}
};

Torus.ui.sidebar_mouseover = () => {
	clearTimeout(Torus.ui.popup_timeout);
	Torus.ui.popup_timeout = 0;
};

Torus.ui.sidebar_mouseout = () => {
	Torus.ui.popup_timeout = setTimeout(Torus.ui.popup.unrender, 500);
};

Torus.ui.window_mouseover = () => {
	document.title = Torus.i18n.text('title');
	// TODO: Monch forgot to uncomment this
	//if(Torus.ui.active.id > 0) {
	//	clearTimeout(Torus.ui.active.away_timeout);
	//	setTimeout(() => {Torus.ui.active.set_status('away', ''); Torus.ui.active.auto_away = true;}, 5 * 60 * 1000);
	//}
};

Torus.ui.window_focus = () => {
	Torus.data.window_focus = true;
};

Torus.ui.window_blur = () => {
	Torus.data.window_focus = false;
};

window.addEventListener('focus', Torus.ui.window_focus);
window.addEventListener('blur', Torus.ui.window_blur);
