//@ts-check
/// <reference path="./type.d.ts" />

//@version-info-start
const VERSION = '???';
//@version-info-end

/*eslint-disable no-console*/

const DEFAULT_CONF_FILE = `${__dirname}/build.config.yaml`;
let getConfigFileName = name => `build.${name}.config.yaml`;

require('colors');

let fs = require('fs-extra'),
	yaml = require('js-yaml'),
	postcss = require('postcss'),
	browserify = require('browserify'),
	{ join: joinPath, dirname, basename, isAbsolute } = require('path'),
	{ exec } = require('child_process'),
	Async = require('async'),
	{ read: loadConfig } = require('./config_reader');

let {
		globFiles,
		readFile,
		writeFileWithMkdirsSync,
		error, exit, getHelp, startTask,
		isPugFile,
		loadYAMLFiles,
		EMPTY_CALLBACK
	} = require('./build_utils');

//@processors-declare-start
let ejs = require('ejs'),
	pug = require('pug'),	
	babel = require('babel-core'),
	sass = require('node-sass'),
	autoprefixer = require('autoprefixer'),
	cheerio = require('cheerio'),
	htmlMinifier = require('html-minifier'),
	browserSync =  require('browser-sync'),
	watch = require('watch'),
	watchify = require('watchify'),
	sourceMapConvert = require('convert-source-map');
//@processors-declare-end

function loadProcessors(opts) {
	let c = processorConfig;
	if (c.source_map.enable && c.source_map.js) sourceMapConvert = require('convert-source-map');
	if (c.sass.enable) sass = require('node-sass');
	if (c.less.enable) console.log('LESS is TODO...');
	if (c.autoprefixer.enable) autoprefixer = require('autoprefixer');
	if (c.babel.enable) babel = require('babel-core');
	if (c.html_minifier.enable) htmlMinifier = require('html-minifier');
	if (c.ejs.enable) ejs = require('ejs');
	if (c.ejs_template_tags.enable) cheerio = require('cheerio');
	if (c.pug.enable) pug = require('pug');

	if (opts.watch) {
		watch = require('watch');
		watchify = require('watchify');

		if (c.browser_sync.enable) browserSync = require('browser-sync');
	}
}

let buildCounter = 0;
let watchMode = false;

/** @type {ConfigObject} */
let config = null;

/** @type {ProcessorsConfig} */
let processorConfig = null;

let bs = null; //browserSync Instance
let ejsRenderVariables = {};

/** @type {ReloadObject} */
let reload = {};
let _reload = files => { buildCounter++; bs && bs.reload(files) };
['html', 'css', 'js'].map(name => reload[name] = () => _reload(`*.${name}`));

function main() {
	let opts = loadLaunchParameters(),
		cfgFile = getConfigFile(opts.mode);
	watchMode = opts.watch;

	if (!cfgFile) return error(`could not load config: ${opts.mode}`), exit(32);
	console.log(`  config: ${cfgFile.bold}`);
	config = loadConfig(cfgFile);
	processorConfig = config.processor;
	//加载相应的插件
	loadProcessors(opts);

	execHook('before_all', err => {
		if (err) return exit(11);

		config.clean_dist && (cleanTarget() || exit(1));
		copyAssets() || exit(2);
		config.concat && config.concat.length && concatFiles(err => err && exit(3));
	
		if (processorConfig.ejs.enable || processorConfig.ejs_template_tags.enable)
			//@ts-ignore
			ejs.fileLoader = ejsFileLoader;
	
		if (processorConfig.ejs_variables.enable) loadEjsVariables() || exit(4);

		let task = startTask('first build');
		Async.parallel([
			buildPages,
			buildScripts,
			buildStyleSheets
		], (err) => {
			if (err) return task.fail(err);
			buildCounter++;
			execHook('after_build', err => err ? exit(10) : task.done());
		});
	
		//opts.watch 是启动参数 watch
		//@ts-ignore
		opts.watch ? (console.log("# Watch mode is on".bold), watchSources())
			: console.log("  Tip: -w option could turn on the watch mode".grey);
	});
}

function cleanTarget() {
	let task = startTask('clean target folder');
	try { fs.removeSync(config.dist); } catch (err) { return task.fail(err), false; }
	return task.done(), true;
}
function copyAssets() {
	let task = startTask(`copy asset files`);
	console.log(`asset folders: ${config.src_assets.map(v => v.name).join(', ')}`);
	try {
		config.src_assets.map(assets => fs.copySync(assets.from, assets.to));
	} catch (err) {
		return task.fail(err), false;
	}
	return task.done(), true;
}
function concatFiles(done = EMPTY_CALLBACK) {
	let task = startTask(`concat files`);
	Async.map(config.concat, (concat, then) => {
		console.log(`concatenating file ${concat.name} `);
		Async.parallel(concat.from.map(from => (readDone => readFile(from, readDone))), (err, contents) => {
			return err
				? (error(`read source file for concatenating failed!`), then(err))
				: (writeFileWithMkdirsSync(concat.to, contents.join('\n')), then());
			// TODO add sources map
		});
	}, err => err ? (task.fail(err), done(err)) : (task.done(), done()));
}


//====================================
//
//    B u i l d      P a g e s
//
//====================================
function getPugOptions(filePath) { return { basedir: config.src, filename: basename(filePath) }; }
function loadEjsVariables() {
	let task = startTask("load ejs variables");
	ejsRenderVariables = loadYAMLFiles(config.processor.ejs_variables.files);
	if (!ejsRenderVariables) return task.fail(`load ejs variable failed (invalid yaml)`), false;
	return task.done(), true;
}
function ejsFileLoader(filePath) {
	if (isPugFile(filePath))
		return processorConfig.pug.enable ?
			pug.compileFile(filePath, getPugOptions(filePath))(ejsRenderVariables)
			: (error(`You had not turn on the pug processor in config file!`), "");
	if (!fs.existsSync(filePath)) {
		filePath.endsWith('.ejs') && (filePath = filePath.replace(/\.ejs$/, '.html'));
		if (!fs.existsSync(filePath))
			return error(`The include page is not existed! (${filePath})`), "";
	}
	return readFile(filePath);
}
function buildPages(callback) {
	let task = startTask('render pages');
	let files = globFiles(config.src_globs, { cwd: config.src });
	console.log(` pages count: ${files.length}`);
	Async.map(files, (name, callback) => {
		let path = joinPath(config.src, name);
		if (isPugFile(name) && processorConfig.pug.enable)
			return render(null, pug.compileFile(path, getPugOptions(path))(ejsRenderVariables));
		if (processorConfig.ejs.enable)
			//@ts-ignore
			return ejs.renderFile(path, ejsRenderVariables, { root: config.src }, render);
		readFile(path, render);

		function render(err, content) {
			if (err) return callback({ path, err });
			if (processorConfig.ejs_template_tags.enable)
				content = renderEjsTemplateTags(content);
			if (processorConfig.html_minifier.enable) {
				try { content = htmlMinifier.minify(content, processorConfig.html_minifier); }
				catch (err) { return callback({ path, err });}
			}
			writeFileWithMkdirsSync(`${config.dist}/${name}`, content);
			callback(null, true);
		}
	}, err => {
		err ? task.fail(err.err, err.path) : task.done();
		callback && callback(err);
	});
}
const DEFAULT_EJS_TEMPLATE_TAG_SELECTOR = 'script[type="text/template"]';
function renderEjsTemplateTags(html) {
	let selector = processorConfig.ejs_template_tags.selector || DEFAULT_EJS_TEMPLATE_TAG_SELECTOR;
	console.log(`  selector: ${selector}`);
	let ejsTagCache = [],	
		random = parseInt(String(Math.random() * 10000)),
		mark = `ejstagcache_${random}_`,
		start = `${mark}start`, end = `${mark}end`,
		recover = new RegExp(`${start}(\\d*)${end}`,'g');
	try {
		let $ = cheerio.load(html);
		let $tags = $(selector);
		for (var i = 0; i < $tags.length; i++) {
			let $tag = $tags.eq(i), html = fs.readFileSync(`${config.src}/${$tag.attr('src')}`, 'utf8');
			if (processorConfig.html_minifier.enable)
				html = htmlMinifier.minify(html, processorConfig.html_minifier);
			$tag.html(html.replace(/<%([\s\S]*?)%>/g, match =>
				(ejsTagCache.push(match), `${start}${ejsTagCache.length - 1}${end}`)));
			$tag.removeAttr('src');
		}
		let newHTML = $.html({ decodeEntities: false }); //避免中文被编码
		return newHTML.replace(recover, (_, index) => ejsTagCache[index]);
	} catch (err) {
		console.error(`  error: render ejs template tags`.red, '\n', err.stack);
		return html;
	}
}

//====================================
//
//    B u i l d      S c r i p t s
//
//====================================
/** 只能调用一次 handlerScripts 因为 脚本 的更新构建 是由 watchify 控制的 */
let hasCalledBuildScriptsFunc = false;
function buildScripts(callback) {
	if (hasCalledBuildScriptsFunc) 
		throw `buildScripts could be only called one time!`;
	hasCalledBuildScriptsFunc = true;

	let task = startTask('handler scripts');
	let { src, dist } = config,	
		files = globFiles(config.src_script_globs, { cwd: src });
	Async.map(files, (name, cb) =>
		browserifyAndBabel(joinPath(src, name), joinPath(dist, getTargetFileName(name)), cb),
		() => (task.done(), callback && callback()));
}
function browserifyAndBabel(from, to, _then) {
	let scriptName = basename(to);
	let isSourceMapOn = processorConfig.source_map.enable && processorConfig.source_map.js;
	let then = _then;
	
	let b = browserify([from], {
		debug: isSourceMapOn, basedir: dirname(to),
		cache: {}, packageCache: {} // for watchify
	});
	// Loading browserify transform from config
	processorConfig.browserify.transform.map(({ name, options }) => b.transform(name, options));
	// Running at watch mode if watchify is not null
	if (watchMode) {
		//@ts-ignore
		b.plugin(watchify, processorConfig.watchify);
		b.on('update', () => {
			then = () => (console.log(`${from} updated!`), reload.js());
			b.bundle(bundleCallback);
		});
	}	
	b.bundle(bundleCallback);

	function bundleCallback(err, buffer) {
		if (err) return console.error(`  error: browserify ${scriptName}`.red, "\n", err), then();	
		let code = String(buffer);	
		let map = null;
		if (isSourceMapOn) {
			map = JSON.parse(sourceMapConvert.fromSource(code).toJSON());
			code = sourceMapConvert.removeMapFileComments(code);
		}
		if (processorConfig.babel.enable) {
			let babel = babelTransform(getBabelrcPath(), scriptName, code, map);
			if (babel.err) return then(babel.err);
			code = babel.code; map = babel.map;
		}
		try {
			writeFileWithMkdirsSync(to, code);
			isSourceMapOn && fs.writeFileSync(`${to}.map`, JSON.stringify(map, null, '\t'));
		} catch (ex) {
			return console.error(`  error: write codes and sources map to target file failed!`.red, "\n", ex.stack || ex), then(ex);
		}
		return then();
	}
}
function getBabelrcPath() {
	let path = processorConfig.babel.babelrc;
	if (path && !isAbsolute(path)) return joinPath(process.cwd(), path);
}
function babelTransform(babelrcPath, scriptName, codes, inSourcesMap = null) {
	try {
		let options = inSourcesMap ? { sourceMaps: true, inputSourceMap: inSourcesMap } : {};
		if (babelrcPath) options.extends = babelrcPath;
		let result = babel.transform(codes, options);
		return {
			code: inSourcesMap ? `${result.code}\n//# sourceMappingURL=${scriptName}.map` : result.code,
			map: result.map
		};
	} catch (err) {
		return error(`babel transform ${scriptName}`, err), { err };
	}
}

//====================================
//
//    B u i l d      S t y l e S h e e t s
//
//====================================
function buildStyleSheets(callback) {
	let task = startTask('handler styles');
	let { src, dist } = config,
		files = globFiles(config.src_styles_globs, { cwd: src });
	Async.map(files, (name, cb) =>
		handlerSassLessAndCss(joinPath(src, name), joinPath(dist, getTargetFileName(name) ), cb),	
		() => (task.done(), callback && callback()));
}
function handlerSassLessAndCss(from, to, then) {
	if (from.endsWith('less')) throw new Error('TODO: support less');
	if (from.endsWith('.sass') || from.endsWith('.scss'))
		return handlerSass(from, to, from.endsWith('.sass'), then);
	if (from.endsWith('.css'))
		return fs.copy(from, to, err => (err && console.error(`  error: copy css file: ${from}`)) + then());
	console.error(`  warning: unknown style file format: ${from}`);
	then();
}
function handlerSass(from, to, indented, then){	
	let styleName = basename(from);
	let isSourceMapOn = processorConfig.source_map.enable && processorConfig.source_map.css;
	let SourcesMapTo = `${to}.map`;
	sass.render({
		file: from,
		indentedSyntax: indented,
		outputStyle: 'compressed',
		outFile: to,
		sourceMap: isSourceMapOn ? SourcesMapTo : void 0
	}, (err, result) => {
		if (err) return console.error(`  error: sass compile ${styleName}`.red, '\n', err), then();
		postcss(autoprefixer ? [autoprefixer] : []).process(result.css, {
			from: styleName,
			to: basename(to),
			map: isSourceMapOn ? { inline: false, prev: JSON.parse(result.map.toString()) } : void 0
		}).then(result => {
			let ws = result.warnings();
			if (ws.length > 0) {
				console.log(`warn: auto prefixer ${styleName}`.yellow.bold);
				ws.forEach(warn => console.log(`  ${warn.toString()}`.yellow));
			}
			writeFileWithMkdirsSync(to, result.css);
			isSourceMapOn && fs.writeFileSync(SourcesMapTo, JSON.stringify(result.map, null, '\t'));
			then();
		}).catch(err => {
			error(`auto prefixer ${styleName}`, err);
			then();
		})
	});
}		

function getTargetFileName(fileName = '') {
	if (fileName.endsWith('.jsx')) return fileName.replace(/\.jsx$/, '.js');
	return fileName.replace(/\.s[ca]ss$/, '.css');
}

function watchSources() {
	if (processorConfig.browser_sync.enable){
		bs = browserSync.create();
		//@ts-ignore
		bs.init(processorConfig.browser_sync);
	}	
	watch.unwatchTree(config.src);
	watch.watchTree(config.src, { interval: 0.5 }, function (path, curr, prev) {
		if (typeof path == "object" && prev === null && curr === null)
			return; //First time scan
		//TODO accurately execute handler
		let p = String(path);
		console.log("watch >".bold, p);
		if (p.endsWith('.yaml'))
			return loadEjsVariables(), buildPages(reload.html);
		if (p.endsWith('.html') || p.endsWith('.ejs') || isPugFile(p))
			return buildPages(reload.html);
		if (p.endsWith('.css') || p.endsWith('.sass') ||
			p.endsWith('.scss') || p.endsWith('.less')) 
			return buildStyleSheets(reload.css);
	});
}

function loadLaunchParameters() {
	let opts = process.argv.slice(2);
	let watch = false, mode = '';
	if (hasOption('-h', '--help')) exit(0, getHelp());
	if (hasOption('-V', '--version')) exit(0, VERSION);
	if (hasOption('-w', '--watch')) watch = true;
	for (let opt of opts) if (!opt.match(/^\-{1,}/)) { mode = opt; break; }
	return { watch, mode };

	function hasOption(...inc) {
		for (let i of inc) if (opts.indexOf(i) >= 0) return true; return false;
	}
}
function getConfigFile(mode = '') {
	let path = ''
	if (!mode) return DEFAULT_CONF_FILE;
	if (fs.existsSync(path = joinPath(__dirname, mode))) return path;
	if (fs.existsSync(path = joinPath(__dirname, getConfigFileName(mode)))) return path;
	return '';
}

//>>>>>>>>>>>> Execute Hook
function execHook(hookName, then = EMPTY_CALLBACK) {
	let hook = config.hook[hookName];
	if (!hook) return then();

	let { command, asynchronous } = hook,
		task = startTask(`hook ${hookName}`);
	exec(`${command} "${buildCounter}"`, { cwd: __dirname, encoding: 'utf8' },
		(err, stdout, stderr) => {
			if (stdout) stdout.trim().split('\n').map(line => `hook out: ${line}`).map(line => console.log(line));
			if (stderr) stderr.trim().split('\n').map(line => `hook err: ${line}`).map(line => console.error(line));
			err ? task.fail(err, `executing hook script "${hookName}" failed!`) : task.done();
			if (!asynchronous) err ? then(err) : then();	
		});
	if (asynchronous) then();
}

main();
