const fs = require('fs'),
      config = require('./config.json');
let contents = fs.readFileSync('template.css').toString();
for (let i in config) {
    contents = contents.replace(new RegExp(`\\$${i}`, 'g'), i === 'name' ? config[i] : `#${config[i]}`);
}
fs.writeFileSync(`themes/${config.name}.css`, contents);
