Torus.cache.save = () => {
	if(Torus.cache.data) {
		Torus.fs.writeFile('data/cache.json', JSON.stringify(Torus.cache.data));
	}
};

Torus.cache.load = () => {
	Torus.cache.data = Torus.files.cache;
};

Torus.cache.update = (domain, entry) => {
	if(entry._cid > Torus.cache.cid) {
		delete Torus.cache.data.data; // TODO: some kind of "clear your browser cache" message
		Torus.cache.data.data = {};
	}
	Torus.cache.data.data[domain] = entry;
	Torus.cache.save();
};

Torus.add_listener('window', 'load', Torus.cache.load);
Torus.add_listener('window', 'unload', Torus.cache.save);
