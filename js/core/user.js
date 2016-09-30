/**
 * user.js
 *
 * Module for handling data about the currently logged in user
 */

/**
 * Initializes the module.
 */
Torus.user.init = function() {
    this.data = Torus.files.userdata || Torus.files.default_userdata;
    this.groups = {};
    this.rights = {};
    Torus.user.get_info('c', () => {
		Torus.user.fetch_token(() => {
			Torus.onload();
		}, (internal, error) => { //jshint ignore:line
			// TODO: Error handling
		});
	}, (internal, error) => { //jshint ignore:line
		// TODO: Error handling
        Torus.onload();
	});
};

Torus.user.save_data = function() {
    Torus.fs.writeFile('data/userdata.json', JSON.stringify(this.data)); // TODO: Error catch
	var event = new Torus.classes.ExtEvent('save_data');
	event.options = this.data;
	Torus.call_listeners(event);
};

/************************** IMPORTANT  ***************************/
/* This is a method for logging in through normal means.         */
/* However, Staff and other important people don't login through */
/* normal means, which means the client won't be able to handle  */
/* logins of important people. If somebody has any idea how to   */
/* implement this to actually work, I'd be very thankful.        */
/* Sorry Staff.                                                  */
/*****************************************************************/
Torus.user.login = function(username, password, ecb) {
    var logindata = {
		lgname: username,
		lgpassword: password // TODO: Make this better
	};
	Torus.io.api('POST', 'login', logindata, (data) => {
		Torus.io.api('POST', 'login', Torus.util.softmerge(logindata, { lgtoken: data.login.token }), (data) => {
            switch(data.login.result) {
                case 'Success':
                    Torus.user.fetch_token(Torus.initialize);
                    // TODO: Error handling
                    break;
                // TODO: Add more cases
                default:
                    break;
            }
		}, ecb);
	}, ecb);
};

Torus.user.get_info = function(wiki, cb, ecb) {
    Torus.io.api('GET', 'query', {
        meta: 'userinfo',
        uiprop: 'groups|rights|options'
    }, (d) => {
        d = d.query.userinfo;
        if(typeof d.anon !== 'string') {
            Torus.user.groups[wiki] = d.groups;
            Torus.user.rights[wiki] = d.rights;
            Torus.user.options = d.options;
            Torus.user.name = d.name;
            if(typeof cb === 'function') {
                cb.call(Torus);
            }
        } else {
            ecb.call(Torus);
        }
    }, ecb);
};

Torus.user.fetch_token = function(cb, ecb) {
    Torus.io.api('GET', 'query', {
        prop: 'info',
        titles: '#',
        intoken: 'edit'
    }, (data) => {
        Torus.user.token = data.query.pages[-1].edittoken;
        if(typeof cb === 'function') {
            cb.call(Torus);
        }
    }, ecb);
};
