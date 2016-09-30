/**
 * main.js
 *
 * Main code for themes extension
 */

/**
 * Initializes the extension, loads theme data from `css/themes` folder
 * and rebuilds the UI
 */
Torus.ext.themes.init = () => {
	Torus.ext.themes.select(Torus.user.data.theme);
	Torus.util.read_dir('css/themes', (d) => {
		Torus.ext.themes.dir = [
			'binary', 'creampuff', 'default', 'plain' // TODO: Make this dynamic
		].concat(d.map(function(el) { return el.replace(/\.css$/, ''); }));
		d.forEach(function(el) {
			Torus.util.load_css(`css/themes/${el}`);
		});
		Torus.ext.themes.rebuild();
	});
};

/**
 * Rebuilds the selector window UI and stores it in `Torus.ext.themes.html`
 */
Torus.ext.themes.rebuild = () => {
	Torus.ext.themes.html = document.createDocumentFragment();
	let children = [];
	Torus.ext.themes.dir.forEach(function(theme) {
		let subchildren = [], mapping = function(el, i) {
			texts.push({
				type: 'div',
				class: 'null text' + (i + 1), // FIXME: I'm stupid
				text: Torus.i18n.text('themes-' + el)
			});
		};
		for(var j = 1; j <= 5; ++j) {
			var texts = []; //jshint ignore:line
			if(j >= 2 && j <= 4) {
				['text', 'link', 'away', 'ping'].forEach(mapping);
			}
			subchildren.push({
				type: 'td',
				class: 'theme-cell bg' + j + ' border' + (j <= 2 ? '1' : j === 3 ? '2' : '3'),
				children: texts
			});
		}
		children.push({
			type: 'tr',
			id: 'theme-tr-' + theme,
			children: [
				{
					type: 'td',
					class: 'border2',
					children: [
						{
							type: 'input',
							inputtype: 'radio',
							name: `theme-${theme}`,
							class: 'theme-radio',
							val: theme,
							click: Torus.ext.themes.click_theme,
							checked: Torus.user.data.theme === theme
						},
						{
							type: 'label',
							for: `theme-${theme}`,
							class: 'theme-label',
							text: Torus.i18n.text(`themes-name-${theme}`)
						}
					]
				},
				{
					type: 'td',
					class: 'null border2', // FIXME: I'm stupid
					children: [
						{
							type: 'table',
							id: `preview-${theme}`,
							class: 'theme-preview theme-' + theme,
							children: subchildren
						}
					]
				}
			]
		});
	});
	Torus.ext.themes.html.appendChild(Torus.util.create_element({
		type: 'table',
		id: 'themes-table',
		children: children
	}));
};

/**
 * Selecting a theme
 * @param {String} theme The theme being selected
 */
Torus.ext.themes.select = function(theme) {
	Torus.ui.window.classList.remove(`theme-${Torus.user.data.theme}`);
	Torus.ui.window.classList.add(`theme-${theme}`);
};

/**
 * Handles when a change theme button is clicked
 */
Torus.ext.themes.click_theme = function() {
	Torus.ext.themes.dir.forEach(function(el) {
		if(el !== this.value) {
			document.getElementsByName(`torus-theme-${el}`)[0].checked = false;
		}
	}, this);
	Torus.ext.themes.select(this.value);
	Torus.user.data.theme = this.value;
	Torus.user.save_data();
};

/**
 * Renders the window with theme contents
 */
Torus.ext.themes.render = () => {
	Torus.ui.ids.window.appendChild(Torus.ext.themes.html);
};

/**
 * Unrenders the window
 */
Torus.ext.themes.unrender = (event) => {
	Torus.ext.themes.html = event.old_window;
};

Torus.add_onload_listener(Torus.ext.themes.init);
Torus.ext.themes.add_listener('ui', 'activate', Torus.ext.themes.render);
Torus.ext.themes.add_listener('ui', 'deactivate', Torus.ext.themes.unrender);
