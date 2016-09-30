Torus.add_listener('io', 'me', Torus.ext.abusefilter.eval);
Torus.add_listener('io', 'message', Torus.ext.abusefilter.eval);
Torus.add_listener('io', 'join', Torus.ext.abusefilter.eval);

Torus.ext.abusefilter.add_listener('ui', 'activate', Torus.ext.abusefilter.render);
Torus.ext.abusefilter.add_listener('ui', 'deactivate', Torus.ext.abusefilter.unrender);
Torus.ext.abusefilter.add_onload_listener(Torus.ext.abusefilter.rebuild);
