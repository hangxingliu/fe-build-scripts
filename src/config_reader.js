//@ts-check
/// <reference path="type.d.ts" />

//@version-info-start
const VERSION = '???';
//@version-info-end

(function () {
	const DEFAULT = {
		WATCHIFY: { delay: 100, ignoreWatch: ['**/node_modules/**'], poll: false },
		BROWSERIFY: { transform: [] }
	};

	const VALID_SYNC_HOOKS = ['before_all', 'after_build'];
	const HOOK_ASYNC_PREFIX = 'async_';

	const VALID_ASYNC_HOOKS = VALID_SYNC_HOOKS.map(name => HOOK_ASYNC_PREFIX + name);
	const VALID_HOOKS = [].concat(VALID_ASYNC_HOOKS, VALID_SYNC_HOOKS);

	const is = {
		null: obj => !obj && typeof obj == 'object',
		object: obj => obj && typeof obj == 'object',
		string: obj => typeof obj == 'string',
		boolean: obj => typeof obj == 'boolean',
		array: obj => Array.isArray(obj),

		stringOrStringArray: obj => is.string(obj) || is.stringArray(obj) ,
		stringArray: obj => {
			if (!Array.isArray(obj)) return false;
			for (let it of obj) if (typeof it != 'string') return false;
			return true;
		},
		objectHasEnableField: obj => is.object(obj) && is.boolean(obj.enable)
	};
	const eachItem = (obj, it) => Object.keys(obj).map(key => it(key, obj[key]));

	let yaml = require('js-yaml'),
		{ readFileSync } = require('fs-extra'),
		{ join: joinPath } = require('path');
	
	/**
	 * @param {string} filePath
	 * @returns {ConfigObject}
	 */
	function reader(filePath) {
		let configStr = readFileSync(filePath, 'utf8'),
			config = yaml.safeLoad(configStr);
		
		// Basic framework
		is.string(config.name) || throwNotAStringError(`name`);
		is.object(config.src) || throwNotAnObjectError(`src`);
		is.object(config.dist) || throwNotAnObjectError(`dist`);
		
		// default value
		if (is.null(config.src.scripts)) config.src.scripts = [];
		if (is.null(config.src.styles)) config.src.styles = [];
		if (is.null(config.src.assets)) config.src.assets = [];
		if (is.null(config.src.pages)) config.src.pages = [];
		if (is.null(config.src.concat)) config.src.concat = {};
		if (is.null(config.hook)) config.src.hook = {};

		is.string(config.src.base) || throwNotAStringError(`src.base`);
		is.stringOrStringArray(config.src.scripts) || throwNotAStringOrStringArrayError(`src.scripts`);
		is.stringOrStringArray(config.src.styles) || throwNotAStringOrStringArrayError(`src.styles`);
		is.stringOrStringArray(config.src.assets) || throwNotAStringOrStringArrayError(`src.assets`);
		is.stringOrStringArray(config.src.pages) || throwNotAStringOrStringArrayError(`src.pages`);
		
		eachItem(config.src.concat, (k, v) => is.stringArray(v) || throwNotAStringArrayError(`src.concat["${k}"]`));
		eachItem(config.hook, (k) => VALID_HOOKS.indexOf(k) >= 0 || throwNotAValidHookNameError(`hook["${k}"]`));
		eachItem(config.hook, (k, v) => is.string(v) || throwNotAStringError(`hook["${k}"]`));
	
		// dist
		is.string(config.dist.base) || throwNotAStringError(`dist.base`);
		is.boolean(config.dist.clean) || throwNotABooleanError(`dist.clean`);

		let basePath = process.cwd(),
			distBasePath = joinPath(basePath, config.dist.base),
			srcBasePath = joinPath(basePath, config.src.base);

		/**
		 * @type {ConfigObject}
		 */
		//@ts-ignore
		let result = {};

		result.name = config.name;
		result.src = srcBasePath;
		result.dist = distBasePath;
		result.clean_dist = !!config.dist.clean;

		let assetsConfig = config.src.assets;
		result.src_assets = (is.string(assetsConfig) ? [assetsConfig] : assetsConfig)
			.map(path => ({ name: path, from: joinPath(srcBasePath, path), to: joinPath(distBasePath, path) }));
		
		let pagesConfig = config.src.pages;
		result.src_globs = (is.string(pagesConfig) ? [pagesConfig] : pagesConfig);
		
		let scriptsConfig = config.src.scripts;
		result.src_script_globs = (is.string(scriptsConfig) ? [scriptsConfig] : scriptsConfig);
		let stylesConfig = config.src.styles;
		result.src_styles_globs = (is.string(stylesConfig) ? [stylesConfig] : stylesConfig);
		
		let concatConfig = config.src.concat || {};
		result.concat = Object.keys(concatConfig).map(distFileName => ({
			name: distFileName,
			to: joinPath(distBasePath, distFileName),
			from: concatConfig[distFileName].map(srcFileName => joinPath(srcBasePath, srcFileName))
		}));

		let hookConfig = config.hook || {},
			hookResult = {};
		Object.keys(hookConfig).map(hookName => {
			hookResult[hookName.replace(HOOK_ASYNC_PREFIX, '')] = {
				command: hookConfig[hookName],
				asynchronous: hookName.startsWith(HOOK_ASYNC_PREFIX)
			};
		});
		result.hook = hookResult;

		/**
		 * @type {ProcessorsConfig}
		 */
		//@ts-ignore
		let processor = {};
		let configProcessor = config.processor || {};
		
		processor.watchify = Object.assign({}, DEFAULT.WATCHIFY, configProcessor.watchify || {});

		processor.browserify = configProcessor.browserify || DEFAULT.BROWSERIFY;
		let { transform } = processor.browserify;
		is.array(transform) || throwNotAnArrayError('processor.browserify.transform');
		processor.browserify.transform = transform.map(trans => is.string(trans) ? { name: String(trans) } : trans);

		['watchify', 'browserify']
			.map(name => processor[name].enable === false ? throwDoNotFalseError(`processor.${name}.enable`) : name)
			.map(name => delete processor[String(name)].enable);

		[
			'sass', 'less', 'autoprefixer',
			'ejs', 'ejs_variables', 'ejs_template_tags',
			'pug', 'html_minifier',
			'babel', 'source_map',
			'browser_sync',
		].map(name => ({ name, config: configProcessor[name] }))
			.map(({ name, config }) =>
				processor[name] = is.objectHasEnableField(config) ? config : { enable: !!config });

		
		result.processor = processor;
		return result;
	
	}
	

	function throwNotAStringError(name) { throw incompleteError(name, 'String'); }
	function throwNotAnObjectError(name) { throw incompleteError(name, 'Object'); }
	function throwNotABooleanError(name) { throw incompleteError(name, 'Boolean'); }
	function throwNotAStringArrayError(name) { throw incompleteError(name, 'String[]'); }
	function throwNotAnArrayError(name) { throw incompleteError(name, 'Any[]'); }
	
	function throwNotAStringOrStringArrayError(name) { throw incompleteError(name, 'String/String[]'); }
	
	function throwNotAValidHookNameError(name) { throw incompleteError(name, 'Hook Name Sting'); }
	function throwDoNotFalseError(name) { throw incompleteError(name, 'True/Undefined (Not allow false)'); }

	function incompleteError(name, type) {
		return new Error(`Config is incomplete. "config.${name}" is not a ${type}!`);
	}
	
	
	module.exports = { read: reader };
})();