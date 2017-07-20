Torus.ui.popup.render = function(name, room, coords) {
	this.name = name;
	this.room = room;
	this.coords = coords;
	this.target = room.userlist[name];
	this.user = room.userlist[Torus.user.name];
	this.domain = room.parent ? room.parent.domain : room.domain;
	Torus.util.empty(Torus.ui.ids.popup);
	this.create_avatar();
	this.create_info();
	this.create_userlinks();
	this.create_actions();
	this.create_other();
};

Torus.ui.popup.create_avatar = function() {
	Torus.util.create_element({
		type: 'img',
		id: 'popup-avatar',
		src: this.target.avatar.replace(/\/scale-to-width-down\/\d+/g, ''),
		parent: 'popup'
	});
};

Torus.ui.popup.create_info = function() {
	var type = this.target.mod ? this.target.givemod ? 'admin' : 'mod' : this.target.staff ? 'staff' : false;
	Torus.util.create_element({
		type: 'div',
		id: 'popup-info',
		parent: 'popup',
		children: [
			{
				type: 'div',
				id: 'popup-info-upper',
				children: [
					{
						type: 'span',
						id: 'popup-name',
						children: [
							{
								type: 'a',
								href: Torus.util.wikilink(this.domain, `User:${this.name}`),
								text: this.name,
								click: Torus.ui.click_link
							}
						]
					},
					{
						type: 'span',
						id: 'popup-access',
						condition: type,
						children: [
							{
								type: 'img',
								class: 'user-icon-' + type,
								src: `img/${type}-icon.png`,
								condition: type
							}
						]
					}
				]
			},
			{
				type: 'div',
				id: 'popup-status-state',
				text: this.target.status_state
			},
			{
				type: 'div',
				id: 'popup-status-message',
				text: this.target.status_message
			}
		]
	});
};

Torus.ui.popup.create_userlinks = function() {
	var cu = this.room.checkuser ? {
		class: 'popup-userlink',
		href: Torus.util.wikilink(this.domain, 'Special:Log/chatconnect', { user: this.name }),
		click: Torus.ui.click_link
	} : { classes: ['popup-userlink', 'popup-userlink-disabled'] };
	Torus.util.create_element({
		type: 'div',
		id: 'popup-userlinks',
		parent: 'popup',
		children: [
			{
				type: 'div',
				children: [
					{
						type: 'a',
						class: 'popup-userlink',
						href: Torus.util.wikilink(this.domain, 'User talk:' + this.name),
						click: Torus.ui.click_link,
						text: Torus.i18n.text('popup-talk')
					},
					{
						type: 'a',
						class: 'popup-userlink',
						href: Torus.util.wikilink(this.domain, 'Special:Contributions/' + this.name),
						click: Torus.ui.click_link,
						text: Torus.i18n.text('popup-contribs')
					}
				]
			},
			{
				type: 'div',
				children: [
					{
						type: 'a',
						class: 'popup-userlink',
						href: Torus.util.wikilink(this.domain, 'Special:Log/chatban', { page: 'User:' + this.name }),
						click: Torus.ui.click_link,
						text: Torus.i18n.text('popup-history')
					},
					Torus.util.softmerge({
						type: 'a',
						text: Torus.i18n.text('popup-chatconnect')
					}, cu)
				]
			}
		]
	});
};

Torus.ui.popup.create_actions = function() {
	let blockAction = Torus.data.blocked.includes(this.name) ? 'unblock' : 'block',
		kickban = ((this.user.staff || this.user.givemod || (this.user.mod && !this.target.mod)) && !this.target.staff && !this.target.givemod);
	Torus.util.create_element({
		type: 'div',
		id: 'popup-actions',
		parent: 'popup',
		children: [
			{
				type: 'a',
				text: Torus.i18n.text('popup-pm'),
				class: 'popup-action',
				click: function() {
					Torus.ui.active.open_private([this.getAttribute('data-user')], function(event) {
						Torus.ui.activate(event.room);
					});
				},
				data: { user: this.name },
				condition: !Torus.data.blockedBy.includes(this.name)
			},
			{
				type: 'a',
				class: 'popup-action',
				data: { user: this.name },
				click: Torus.ui[`popup_${blockAction}`],
				text: Torus.i18n.text(`popup-${blockAction}`)
			},
			{
				type: 'a',
				class: 'popup-action',
				click: function() {
					this.children[0].style.display = 'block';
				},
				children: [
					{
						type: 'div',
						id: 'popup-modconfirm',
						children: [
							{
								type: 'input',
								id: 'popup-modconfirm-yes',
								inputtype: 'button',
								val: Torus.util.cap(Torus.i18n.text('yes')),
								click: function(event) {
									event.stopPropagation();
									this.parentNode.style.display = 'none';
									Torus.ui.active.mod(this.getAttribute('data-user'));
								},
								data: { user: this.name }
							},
							' ' + Torus.i18n.text('popup-mod-areyousure') + ' ',
							{
								type: 'input',
								inputtype: 'button',
								id: 'popup-modconfirm-no',
								val: Torus.util.cap(Torus.i18n.text('no')),
								click: function(event) {
									event.stopPropagation();
									this.parentNode.style.display = 'none';
								}
							}
						]
					},
					Torus.i18n.text('popup-mod')
				],
				condition: (this.user.givemod || this.user.staff) && !this.target.mod && !this.target.staff
			},
			{
				type: 'a',
				class: 'popup-action',
				data: { user: this.name },
				click: function() {
					Torus.ui.active.kick(this.getAttribute('data-user'));
				},
				text: Torus.i18n.text('popup-kick'),
				condition: kickban
			},
			{
				type: 'a',
				class: 'popup-action',
				children: [
					{
						type: 'div',
						id: 'popup-banmodal',
						data: { user: this.name },
						children: [
							{
								type: 'div',
								children: [
									{
										type: 'label',
										for: 'popup-banexpiry',
										text: Torus.i18n.text('popup-ban-expiry') + ':'
									},
									' ',
									{
										type: 'input',
										id: 'popup-banexpiry',
										inputtype: 'text',
										placeholder: '1 day', // FIXME: i18n
										keyup: function(event) {
											if(event.keyCode === 13) {
												Torus.ui.active.ban(
													this.parentNode.parentNode.getAttribute('data-user'),
													this.parentNode.nextSibling.lastChild.value,
													this.value ?
														Torus.util.expiry_to_seconds(this.value) :
														60 * 60 * 24
												);
											}
										}
									}
								]
							},
							{
								type: 'div',
								children: [
									{
										type: 'label',
										for: 'popup-banexpiry',
										text: Torus.i18n.text('popup-ban-reason') + ':'
									},
									' ',
									{
										type: 'input',
										inputtype: 'text',
										id: 'popup-banreason',
										placeholder: 'Misbehaving in chat', // FIXME: i18n
										keyup: function(event) {
											if(event.keyCode === 13) {
												var expiry = this.parentNode.previousSibling.lastChild.value;
												Torus.ui.active.ban(
													this.parentNode.parentNode.getAttribute('data-user'),
													expiry ? Torus.util.expiry_to_seconds(expiry) : 86400,
													this.value
												);
											}
										}
									}
								]
							},
							{ // TODO: For some reason, in Monch's version this element isn't even appended?!?!
								type: 'div',
								children: [
									{
										type: 'submit', // TODO: Or input?
										inputtype: 'submit',
										val: Torus.i18n.text('popup-ban'),
										id: 'popup-banbutton',
										click: function() {
											var expiry = this.parentNode.previousSibling.previousSibling.lastChild.value;
											Torus.ui.active.ban(
												this.parentNode.parentNode.getAttribute('data-user'),
												expiry ? Torus.util.expiry_to_seconds(expiry) : 86400,
												this.parentNode.previousSibling.lastChild.value
											);
										}
									}
								]
							}
						]
					},
					Torus.i18n.text('popup-ban')
				],
				condition: kickban
			}
		]
	});
};

Torus.ui.popup.create_other = function() { // TODO: Better name
	var id = Torus.ui.ids.popup;
	id.style.display = 'block';
	if(this.coords) {
		id.style.right = 'auto';
		id.style.left = this.coords.x + 'px';
		id.style.top = this.coords.y + 'px';
	} else {
		var userlist = Torus.ui.ids.sidebar.children;
		for(var i = 0; i < userlist.length; i++) {
			if(userlist[i].lastChild.innerHTML === this.name) {
				id.style.top = (userlist[i].offsetTop - Torus.ui.ids.sidebar.scrollTop + id.offsetHeight > Torus.ui.window.offsetHeight ?
					Torus.ui.window.offsetHeight - id.offsetHeight :
					userlist[i].offsetTop - Torus.ui.ids.sidebar.scrollTop) + 'px';
				break;
			}
		}
	}
	var event = new Torus.classes.UIEvent('render_popup');
	event.user = this.name;
	Torus.call_listeners(event);
};

Torus.ui.popup.unrender = function() {
	var id = Torus.ui.ids.popup;
	id.style.top = '';
	id.style.right = '';
	id.style.left = '';
	id.style.display = 'none';
	Torus.util.empty(id);
	Torus.call_listeners(new Torus.classes.UIEvent('unrender_popup'));
};

Torus.ui.popup.block = function() {
	this.appendChild(Torus.ui.img_loader());
	var el = this;
	Torus.io.block(this.getAttribute('data-user'), function() { // FIXME: closure
		Torus.util.empty(el);
		el.removeEventListener('click', Torus.ui.popup.block);
		el.addEventListener('click', Torus.ui.popup.unblock);
		el.textContent = Torus.i18n.text('popup-unblock');
	});
};

Torus.ui.popup.unblock = function() {
	this.appendChild(Torus.ui.img_loader());
	var el = this;
	Torus.io.unblock(this.getAttribute('data-user'), function() { // FIXME: closure
		Torus.util.empty(el);
		el.removeEventListener('click', Torus.ui.popup.unblock);
		el.addEventListener('click', Torus.ui.popup.block);
		el.textContent = Torus.i18n.text('popup-block');
	});
};
