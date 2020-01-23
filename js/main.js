(() => {
    var obj = require(`${__dirname}/js/main.json`);
    for(var i in obj) {
        if(obj.hasOwnProperty(i) && obj[i] instanceof Array) {
            // TODO: Nasty!!!
            obj[i].forEach((el) => { //jshint ignore:line
                var js = document.createElement('script');
            		js.className = 'torus-js';
            		js.src = `js/${i}/${el}.js`;
            		js.type = 'text/javascript';
                    js.async = false;
            	document.head.appendChild(js);
            });
        }
    }
})();
