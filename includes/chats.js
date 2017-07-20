class Chats {
    static initialize() {
        Chats.rooms = {};
    }
    /**
     * Opens a room in the specified wiki
     * If the room is private, `parent` and `users` parameters are required
     * @param {String} domain Wiki domain on which to open the room
     * @param {Torus.classes.Chat} parent Parent room of the private room
     * @param {Array<String>} users Users that are in the room
     */
    static open(domain, parent, users) {
        let chat = Chats.rooms[domain] || new Torus.classes.Chat(domain, parent, users);
    	if(!chat.connecting && !chat.connected) {
    		chat.connect();
    	}
    	return chat;
    }
    /**
     * Sends the logout signal to the server
     * and disconnects from the chat server
     */
    static logout() {
        for(let i in Chats.rooms) {
            if(Chats.hasOwnProperty(i) && i > 0) {
                const chat = Chats.rooms[i];
                chat.send_command('logout');
                Torus.call_listeners(new Torus.classes.ChatEvent('logout', chat));
                chat.disconnect('logout');
            }
        }
    }
    /**
     * Shows a message to specified room(s)
     * By default, shows the message in #status
     * @param {String} text Message to send
     * @param {Torus.classes.Chat} room Room to send the message in
     */
    static alert(text, room) {
        room = room || Chats.rooms[0];
        text.trim().split('\n').forEach(function(el) {
            const event = new Torus.classes.IOEvent('alert', room);
            event.text = el;
            Torus.call_listeners(event);
        });
    }
}

module.exports = Chats;
