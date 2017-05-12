let { read } = require('../build/config_reader');
let obj = read(`${__dirname}/../build/build.config.yaml`);
console.log(obj);
process.exit(0);