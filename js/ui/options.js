new Torus.classes.Extension('options');

Torus.ext.options.ui = {
	sidebar: document.createDocumentFragment()
};

Torus.ext.options.selected = 'messages';
Torus.ext.options.types = {};

Torus.ext.options.rebuild = () => {
	Torus.ext.options.ui = {};
	Torus.ext.options.ui.sidebar = document.createDocumentFragment();
	for(var i in Torus.files.options_dir) {
		var li = Torus.util.create_element({
			type: 'li',
			class: 'sidebar-button',
			data: { id: i },
			text: Torus.i18n.text('options-' + i),
			click: Torus.ext.options.click_sidebar
		}),
		frag = document.createDocumentFragment(),
		dir = Torus.files.options_dir[i];
		if(i === Torus.ext.options.selected) {
			li.classList.add('torus-sidebar-button-selected');
		}
		Torus.ext.options.ui.sidebar.appendChild(li);
		for(var j in dir) { // TODO: Guess what
			var children = [],
				opt = dir[j];
			children.push((opt.enabled && opt[opt.enabled] === 'boolean') ? {
				type: 'legend',
				children: [
					{
						type: 'label',
						for: 'option-value-' + i + '-' + j + '-enabled',
						text: Torus.i18n.text('options-' + i + '-' + j)
					}, ' ', Torus.ext.options.types.boolean(opt.enabled)
				]
			} : {
				type: 'legend',
				text: Torus.i18n.text('options-' + i + '-' + j)
			});
			for(var k in opt) {
				if(k === 'enabled' || k === opt.enabled) {
					continue;
				}
				var type = opt[k];
				children.push({
					type: 'div',
					id: 'option-value-' + k,
					children: [
						{
							type: 'label',
							for: 'option-value-' + k + '-input',
							text: Torus.i18n.text('options-' + k)
						}, ': ', Torus.ext.options.types[type](k)
					]
				});
			}
			frag.appendChild(Torus.util.create_element({
				type: 'fieldset',
				id: 'option-set-' + i + '-' + j,
				children: children
			}));
		}
		Torus.ext.options.ui['group_' + i] = frag;
	}

	if(Torus.ui.active === Torus.ext.options) {
		Torus.util.empty(Torus.ui.ids.sidebar);
		Torus.util.empty(Torus.ui.ids.window);
		Torus.ext.options.render(Torus.ext.options.selected);
	}
};

Torus.ext.options.render = (group) => {
	if(!group || typeof group === 'object') {
		group = Torus.ext.options.selected;
	} // group == object when ui.activate fires

	if(Torus.ui.ids.window.firstChild) { // an options group is already rendered, put it back
		Torus.ext.options.ui['group_' + Torus.ext.options.selected] = Torus.util.empty(Torus.ui.ids.window);
	}

	var sidebarChildren = Torus.ui.ids.sidebar.children;
	for(var i = 0; i < sidebarChildren.length; i++) {
		sidebarChildren[i].classList[(sidebarChildren[i].getAttribute('data-id') === group) ? 'add' : 'remove']('torus-sidebar-button-selected');
	}

	Torus.ui.ids.window.appendChild(Torus.ext.options.ui['group_' + group]);
	Torus.ui.ids.sidebar.appendChild(Torus.ext.options.ui.sidebar);

	if(!group) {
		throw new Error('wot'); // if this happens I need to know
	}
	Torus.ext.options.selected = group;
};

Torus.ext.options.unrender = (event) => {
	Torus.ext.options.ui.sidebar = event.old_sidebar;
	Torus.ext.options.ui['group_' + Torus.ext.options.selected] = event.old_window;
	Torus.user.save_data();
};

Torus.ext.options.types.base = function(option, type, formtype, object) {
	return Torus.util.softmerge({
		type: formtype,
		id: 'option-value-' + option + '-input',
		class: 'option-' + type,
		data: { id: option }
	}, object);
};

Torus.ext.options.types.text = function(option) {
	return this.base(option, 'text', 'textarea', {
		val: Torus.user.data.options[option],
		blur: Torus.ext.options.blur_text,
		rows: 6
	});
};

Torus.ext.options.types.string = function(option) {
	return this.base(option, 'string', 'input', {
		inputtype: 'text',
		val: Torus.user.data.options[option],
		blur: Torus.ext.options.blur_text
	});
};

Torus.ext.options.types.number = function(option) {
	return this.base(option, 'number', 'input', {
		inputtype: 'number',
		blur: Torus.ext.options.blur_number,
		val: Torus.user.data.options[option].toString()
	});
};

Torus.ext.options.types.boolean = function(option) {
	return this.base(option, 'boolean', 'input', {
		inputtype: 'checkbox',
		change: Torus.ext.options.click_boolean,
		checked: Torus.user.data.options[option]
	});
};

Torus.ext.options.types.array = (option) => {
	var target = Torus.user.data.options[option],
		children = [];
	for(var i = 0; i < target.length; i++) {
		children.push(Torus.ext.options.types.li(option, i, target[i]));
	}
	return {
		type: 'div',
		class: 'option-array',
		children: [
			{
				type: 'ul',
				children: children
			},
			{
				type: 'input',
				id: 'option-value-' + option + '-input',
				inputtype: 'text',
				data: { id: option },
				keyup: Torus.ext.options.keyup_array_input
			}
		]
	};
};

Torus.ext.options.types.li = (option, i, val) => {
	return {
		type: 'li',
		text: val,
		data: {
			i: i,
			val: val,
			option: option
		},
		children: [
			{
				type: 'span',
				class: 'option-array-remove',
				text: 'X',
				click: Torus.ext.options.click_array_remove
			}
		]
	};
};

Torus.ext.options.blur_text = function() {
	Torus.user.data.options[this.getAttribute('data-id')] = this.value;
};
Torus.ext.options.blur_number = function() {
	Torus.user.data.options[this.getAttribute('data-id')] = this.value * 1;
};
Torus.ext.options.click_boolean = function() {
	Torus.user.data.options[this.getAttribute('data-id')] = this.checked;
};
Torus.ext.options.keyup_array_input = function() {
	if(event.keyCode === 13) {
		event.preventDefault();
		var target = Torus.user.data.options[this.getAttribute('data-id')];
		this.previousSibling.appendChild(Torus.util.create_element(Torus.ext.options.types.li(this.getAttribute('data-id'), target.length, this.value)));
		target.push(this.value);
		this.value = '';
	}
};
Torus.ext.options.click_array_remove = function() {
	for(var el = this.nextSibling; el !== null; el = el.nextSibling) {
		el.setAttribute(el.getAttribute('data-i') * 1 + 1);
	}
	this.parentNode.parentNode.removeChild(this.parentNode);
	Torus.user.data.options[this.parentNode.getAttribute('data-option')].splice(this.parentNode.getAttribute('data-i') * 1, 1);
};

Torus.ext.options.click_sidebar = function() {
	Torus.ext.options.render(this.getAttribute('data-id'));
};

Torus.ext.options.add_listener('ui', 'activate', Torus.ext.options.render);
Torus.ext.options.add_listener('ui', 'deactivate', Torus.ext.options.unrender);
