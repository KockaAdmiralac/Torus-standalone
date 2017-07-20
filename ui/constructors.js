Torus.ui.img_loader = () => {
	return {
		type: 'img',
		class: 'loader',
		src: 'http://slot1.images.wikia.nocookie.net/__cb1410215834/common/skins/common/images/ajax.gif'
	};
};

Torus.ui.span_user = (user) => {
	return {
		type: 'span',
		class: 'message-usercolor',
		style: {
			color: Torus.util.color_hash(user, Torus.user.data.options.colorhue, Torus.user.data.options.colorval, Torus.user.data.options.colorsat)
		},
		text: user
	};
};
