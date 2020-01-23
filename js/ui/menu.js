Torus.ui.menu = {};

Torus.ui.menu.render = () => {
	Torus.ui.menu.render_name();
	Torus.ui.menu.render_links();
	Torus.ui.menu.render_extensions();
};

Torus.ui.menu.render_name = () => {
	Torus.util.create_element({
		type: 'div',
		id: 'menu-name',
		text: Torus.i18n.text('menu-torus', Torus.get_version()),
		parent: 'window'
	});
};

Torus.ui.menu.render_links = () => {
	var children = [], first = true;
	for(var link in Torus.files.menulinks) {
		if(first) {
			first = false;
		} else {
			children.push(' | ');
		}
		children.push({
			type: 'a',
			href: Torus.files.menulinks[link],
			text: Torus.i18n.text('menu-' + link),
			click: Torus.ui.click_link
		});
	}
	Torus.util.create_element({
		type: 'div',
		id: 'menu-links',
		children: children,
		parent: 'window'
	});
};

Torus.ui.menu.render_extensions = () => {
	var children = [];
	for(var i in Torus.ext) {
		if(Torus.ext.hasOwnProperty(i)) {
			var ext = Torus.ext[i];
			if(ext.nomenu) {
				continue;
			}
			children.push({
				type: 'a',
				data: { id: i },
				text: ext.name ? Torus.i18n.text(ext.name + '-name') : i,
				click: Torus.ui.menu.click_extension
			});
		}
	}
	Torus.util.create_element({
		type: 'div',
		id: 'menu-extensions',
		children: children,
		parent: 'window'
	});
};

Torus.ui.menu.click_extension = function() {
	Torus.ui.activate(Torus.ext[this.getAttribute('data-id')]);
};

Torus.ui.menu.tab_click = () => {
	Torus.ui.activate(Torus.ext.ui);
};

// activating the ui extension gives you the menu
Torus.ext.ui.add_listener('ui', 'activate', Torus.ui.menu.render);
Torus.ext.ui.add_listener('ui', 'deactivate', Torus.util.null); // FIXME: i'm sure something important is supposed to go here
