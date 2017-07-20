/**
 * user.js
 *
 * Module for handling data about the currently logged in user
 */
class User {
    /**
     * Initializes the module.
     */
    static initialize() {
        this.data = Torus.files.userdata || Torus.files.default_userdata;
        this.groups = {};
        this.rights = {};
        Torus.user.getInfo('c', function() {
    		Torus.user.fetchToken(function() {
    		    Torus.onload();
    		}, function(internal, error) { // jshint ignore:line
    			// TODO: Error handling
    		});
    	}, function(internal, error) { // jshint ignore:line
    		// TODO: Error handling
            Torus.onload();
    	});
    }
    static saveData() {
        Torus.util.saveData(this.data, 'userdata');
    	Torus.callListeners('ext', 'save_data', this.data);
    }
    /************************** IMPORTANT  ***************************/
    /* This is a method for logging in through normal means.         */
    /* However, Staff and other important people don't login through */
    /* normal means, which means the client won't be able to handle  */
    /* logins of important people. If somebody has any idea how to   */
    /* implement this to actually work, I'd be very thankful.        */
    /* Sorry Staff.                                                  */
    /*****************************************************************/
    static login(username, password, ecb) {
        const logindata = {
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
    }
    static getInfo(wiki, cb, ecb) {
        Torus.io.api('GET', 'query', {
            meta: 'userinfo',
            uiprop: 'groups|rights|options'
        }, function(d) {
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
    }
    static fetchToken(cb, ecb) {
        Torus.io.api('GET', 'query', {
            prop: 'info',
            titles: '#',
            intoken: 'edit'
        }, function(data) {
            Torus.user.token = data.query.pages[-1].edittoken;
            if(typeof cb === 'function') {
                cb.call(Torus);
            }
        }, ecb);
    }
    /**
     * Method for logging the user out
     */
    static logout() {
        Torus.io.api('POST', 'logout');
    }
}

module.exports = User;
