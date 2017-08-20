//@ts-check
/// <reference path="./type.d.ts" />

//@version-info-start
const VERSION = '???';
//@version-info-end

require('colors');
let glob = require('glob'),
	fs = require('fs-extra'),
	yaml = require('js-yaml'),
	{ dirname } = require('path');

const EMPTY_CALLBACK = (...args) => void args;
let error = (msg = '', ex = null) => {
	console.error(`  error: ${msg}`.red);
	ex && console.error(ex.stack || ex)
};

module.exports = {
	EMPTY_CALLBACK,
	error,

	globFiles,
	readFile,
	writeFileWithMkdirsSync,
	getHelp,
	startTask,
	loadYAMLFiles,

	exit: (code = 0, msg = '') => {
		msg && console.log(msg); process.exit(code)
	},
	isPugFile: file => file.endsWith('.pug') || file.endsWith('.jade'),

};

function startTask(name) {
	console.log(`# ${name} `.bold + `...`);
	return {
		done: () =>console.log(` ${name} done`.green),
		fail: (err, msg = "") => console.error(` ${name} fail: ${msg}`.red + `\n`, err && (err.stack || err))
	};
}

function loadYAMLFiles(files) {
	let obj = {};
	files.map(file => {
		try {
			let extend = yaml.safeLoad(String(readFile(file)));
			obj = Object.assign(obj, extend);
		} catch (err) {
			return null;
		}
	});
	return obj;
}

//ReadFile: Async and Sync
function readFile(path, cb = null) {
	return cb ? fs.readFile(path, 'utf8', cb) : fs.readFileSync(path, 'utf8');
}

//Write File with mkdirs dir
function writeFileWithMkdirsSync(path = '', content = '') {
	let dir = dirname(path);
	fs.existsSync(dir) || fs.mkdirsSync(dir);
	fs.writeFileSync(path, content);
}

//Glob files
function globFiles(globArray, options) {
	let allFiles = [];
	globArray.map(globStr => {
		try {
			allFiles = allFiles.concat(glob.sync(globStr, options));
		} catch (err) {
			error(`invalid glob: ${glob}`);
		}
	});
	return allFiles;
}

function getHelp() {
	return [
		`Usage: build.js [options] [configName]\n`,
		`Version: ${VERSION}`,
		`Front-end build scripts pack\n`,
		`Options:`, 
		`  -V --version  output the version info`,
		`  -h --help     output this help info`,
		`  -w --watch    turn on the watch building mode\n`,
		`ConfigName:`,
		`  [default]     build.config.yaml`,
		`  dev           build.dev.config.yaml`,
		`  prod          build.prod.config.yaml`,
		`  <fileName>    load config from fileName you given`
	].map(l=>'  '+l).join('\n');
}