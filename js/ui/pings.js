Torus.ui.ping = function(event) {
	var room = event.room;
	if(!Torus.user.data.pings['#global'].enabled || !Torus.ui.window.parentNode) {
		return;
	}
	if((room !== Torus.ui.active && !room.viewing) || Torus.ui.active.id <= 0) {
		Torus.ui.ids['tab-' + room.domain].classList.add('torus-tab-ping');
	}
	var domain = room.parent ? room.parent.domain : room.domain,
		data = Torus.user.data.pings[domain];
	document.title = data.alert;
	if(data.beep) {
		var beep = document.createElement('audio'),
			sound = data.sound;
		if(!sound.startsWith('http://') && !sound.startsWith('https://')) {
			sound = `audio/${sound}`;
		}
		beep.src = sound;
		beep.play();
	}
	if(data.notification || Torus.user.data.pings['#global'].notification) {
		var text;
		switch(event.event) {
			case 'message':
				text = event.text;
				break;
			// TODO: Implement on-join/part/etc pings
		}
		if(text && room.userlist[event.user] && !Torus.data.window_focus) {
			new Notification(`${event.user} {${room.name}}`, {
				icon: room.userlist[event.user].avatar.replace(/scale-to-width-down.*/g, ''),
				silent: true, // TODO: Maybe make this a config?
				body: text
			});
		}
		//new Notification();
	}
	Torus.call_listeners(new Torus.classes.UIEvent('ping', room));
};

// TODO: Make this not a more specific copy of options.js
// TODO: Make removing rooms possible
Torus.ui.pings = new Torus.classes.Extension('pings');

Torus.ui.pings.selected = '#global';

Torus.ui.pings.rebuild = function() {
	this.ui = {
		sidebar: document.createDocumentFragment()
	};
	for(var i in Torus.user.data.pings) {
		var li = Torus.util.create_element({
			type: 'li',
			class: 'sidebar-button',
			data: { id: i },
			text: i,
			click: this.click_sidebar
		}),
		frag = document.createDocumentFragment(),
		dir = Torus.user.data.pings[i];
		if(i === this.selected) {
			li.classList.add('torus-sidebar-button-selected');
		}
		this.ui.sidebar.appendChild(li);

		frag.appendChild(Torus.util.create_element({
			type: 'fieldset',
			id: 'pings-' + i + '-fieldset',
			class: 'pings-fieldset',
			children: [
				{
					type: 'legend',
					text: i
				},
				this.create_element(i, 'enabled', 'input', 'boolean', {
					inputtype: 'checkbox',
					blur: this.blur_boolean,
					checked: dir.enabled
				}),
				this.create_element(i, 'alert', 'input', 'string', {
					inputtype: 'text',
					val: dir.alert,
					blur: this.blur_string
				}),
				this.create_element(i, 'beep', 'input', 'boolean', {
					inputtype: 'checkbox',
					checked: dir.beep,
					blur: this.blur_boolean
				}),
				this.create_element(i, 'notification', 'input', 'boolean', {
					inputtype: 'checkbox',
					checked: dir.notification,
					blur: this.blur_boolean
				}),
				this.create_element(i, 'sound', 'input', 'string', {
					inputtype: 'text',
					val: dir.sound,
					blur: this.blur_sound
				}),
				this.create_element(i, 'literal', 'textarea', 'text', {
					rows: 5,
					val: dir.literal.join('\n'),
					blur: this.blur_literal
				}, true),
				this.create_element(i, 'regex', 'textarea', 'text', {
					rows: 10,
					val: dir.regex.map(function(el) { return el.toString() + '\n'; }),
				}, true)
			]
		}));
		this.ui['group_' + i] = frag;
	}

	this.ui.sidebar.appendChild(Torus.util.create_element({
		type: 'li',
		id: 'pings-add',
		class: 'sidebar-button',
		text: Torus.i18n.text('pings-add'),
		click: this.click_add
	}));

	if(Torus.ui.active === this) {
		Torus.util.empty(Torus.ui.ids.sidebar);
		Torus.util.empty(Torus.ui.ids.window);
		this.render(this.selected);
	}
};

Torus.ui.pings.create_element = function(i, type, field, proto, obj, br) {
	return {
		type: 'div',
		children: [
			{
				type: 'label',
				for: 'pings-' + i + '-' + type,
				text: Torus.i18n.text('pings-' + type)
			}, ' ', { type: br ? 'br' : 'span' }, // FIXME: Useless spans
			Torus.util.softmerge(obj, {
				type: field,
				id: 'pings-' + i + '-' + type,
				class: 'option-' + proto,
				data: {
					id: i,
					type: type
				}
			})
		]
	};
};

Torus.ui.pings.render = function(group) {
	group = (!group || typeof group === 'object') ?
		this.selected : // group == object when ui.activate fires
		(group === '') ? // groups == '' if someone clicks "add", then goes away and comes back
			'#global' :
			group;

	if(Torus.ui.ids.window.firstChild) { // a group is already rendered, put it back
		this.ui['group_' + this.selected] = Torus.util.empty(Torus.ui.ids.window);
	}

	var sidebarChildren = Torus.ui.ids.sidebar.children;
	for(var i = 0; i < sidebarChildren.length; ++i) {
		sidebarChildren[i].classList[sidebarChildren[i].getAttribute('data-id') === group ? 'add' : 'remove']('torus-sidebar-button-selected');
	}

	Torus.ui.ids.window.appendChild(this.ui['group_' + group]);
	Torus.ui.ids.sidebar.appendChild(this.ui.sidebar);

	if(!group) {
		throw new Error('wat'); // if this happens I need to know
	}
	this.selected = group;
};

Torus.ui.pings.unrender = function(event) {
	this.ui.sidebar = event.old_sidebar;
	this.ui['group_' + this.selected] = event.old_window;
	Torus.user.save_data();
};

Torus.ui.pings.click_sidebar = function() {
	Torus.ui.pings.render(this.getAttribute('data-id'));
};

Torus.ui.pings.click_add = function() { // FIXME: this works, but is stupid
	if(!Torus.ui.pings.selected) {
		return;
	}

	Torus.ui.pings.ui['group_' + this.selected] = Torus.util.empty(Torus.ui.ids.window);
	for(var i = 0; i < Torus.ui.ids.sidebar.children.length; ++i) {
		Torus.ui.ids.sidebar.children[i].classList.remove('torus-sidebar-button-selected');
	}
	this.classList.add('torus-sidebar-button-selected');

	Torus.ui.pings.selected = '';
	Torus.util.create_element({
		parent: 'window',
		type: 'div',
		children: [
			{
				type: 'label',
				for: 'pings-add-input',
				text: Torus.i18n.text('pings-add') + ':'
			}, ' ', {
				type: 'input',
				inputtype: 'text',
				id: 'pings-add-input',
				keyup: function() {
					if(event.keyCode === 13) {
						if(!Torus.user.data.pings[this.value]) {
							Torus.user.data.pings[this.value] = Torus.user.data.pings['#global'];
							Torus.user.data.pings[this.value].enabled = true;
							Torus.user.data.pings[this.value].literal = [];
							Torus.user.data.pings[this.value].regex = [];
						}
						Torus.ui.pings.selected = this.value;
						Torus.ui.pings.rebuild();
					}
				}
			}
		]
	});
	Torus.ui.ids['pings-add-input'].focus();
};

Torus.ui.pings.blur_boolean = function() {
	Torus.user.data.pings[this.getAttribute('data-id')][this.getAttribute('data-type')] = this.checked;
};
Torus.ui.pings.blur_string = function() {
	Torus.user.data.pings[this.getAttribute('data-id')][this.getAttribute('data-type')] = this.value;
};
Torus.ui.pings.blur_literal = function() {
	var pings = this.value.toLowerCase().split('\n').filter(function(el) {
		return el;
	});
	Torus.user.data.pings[this.getAttribute('data-id')].literal = pings;
};
Torus.ui.pings.blur_regex = function() {
	var arr = [],
		pings = this.value.split('\n');
	pings.forEach(function(el) {
		var regex = Torus.util.parse_regex(el);
		if(regex) {
			arr.push(regex);
		}
	});
	Torus.user.data.pings[this.getAttribute('data-id')].regex = arr;
};

Torus.ui.pings.add_listener('ui', 'activate', Torus.ui.pings.render.bind(Torus.ui.pings));
Torus.ui.pings.add_listener('ui', 'deactivate', Torus.ui.pings.unrender.bind(Torus.ui.pings));
