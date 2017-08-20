#!/usr/bin/env node
/**
 * @license Apache-2.0
 * 
 * frontend build scripts
 * version: 0.6.2
 * date: 2017-08-21 02:53
 */
const a = '0.6.2',
b = `${__dirname}/build.config.yaml`;
require('colors');
let c = require('fs-extra'),
d = require('glob'),
e = require('js-yaml'),
f = require('postcss'),
g = require('browserify'),
{ join: h, dirname: i, basename: j, isAbsolute: k } = require('path'),
{ exec: l } = require('child_process'),
m = require('async'),
{ read: n } = require('./config_reader'),
o = null,
p = null,
q = null,
r = null,
s = null,
t = null,
u = null,
v = null,
w = null,
x = null,
y = null;
function z(a) {
	let b = E;
	b.source_map.enable && b.source_map.js && (y = require('convert-source-map')),
	b.sass.enable && (r = require('node-sass')),
	b.less.enable && console.log('LESS is TODO...'),
	b.autoprefixer.enable && (s = require('autoprefixer')),
	b.browser_sync.enable && a.watch && (v = require('browser-sync')),
	b.babel.enable && (q = require('babel-core')),
	b.html_minifier.enable && (u = require('html-minifier')),
	b.ejs.enable && (o = require('ejs')),
	b.ejs_template_tags.enable && (t = require('cheerio')),
	b.pug.enable && (p = require('pug')),
	a.watch && (
	w = require('watch'),
	x = require('watchify'));
}
let A = (a) => (
console.log(`# ${a} `.bold + `...`),
{
	done: () => console.log(` ${a} done`.green),
	fail: (b, c = "") => console.error(` ${a} fail: ${c}`.red + `\n`, b && (b.stack || b)) }),
B = { e: (a, b) => {console.error(`  error: ${b}`.red), a && console.error(a.stack || a);} },
C = 0,
D = null,
E = null,
F = null,
G = (a) => {C++, F && F.reload(a);},
H = {};
['html', 'css', 'js'].map((a) => H[a] = () => G(`*.${a}`));
let I = !1;
const J = (...a) => void a;
function K() {
	let a = da(),
	c = (a) => process.exit(a);
	D = n(b),
	E = D.processor,
	z(a),
	ha('before_all', (b) => {
		if (b) return c(11);
		D.clean_dist && (L() || c(1)),
		M() || c(2),
		D.concat && D.concat.length && N((a) => a && c(3)),
		(E.ejs.enable || E.ejs_template_tags.enable) && Q(),
		E.ejs_variables.enable && (S() || c(4));
		let d = A('first build');
		m.parallel([T, W, $],
		(a) => a ?
		d.fail(a) : void (
		C++,
		ha('after_build', (a) => a ? c(10) : d.done()))),
		a.watch ? (console.log("# Watch mode is on".bold), ca()) :
		console.log("  Tip: -w option could turn on the watch mode".grey);
	});
}
function L() {
	let a = A('clean target folder');
	try {c.removeSync(D.dist);} catch (b) {return a.fail(b), !1;}
	return a.done(), !0;
}
function M() {
	let a = A(`copy asset files`);
	console.log(`asset folders: ${D.src_assets.map((a) => a.name).join(', ')}`);
	try {
		D.src_assets.map((a) => c.copySync(a.from, a.to));
	} catch (b) {
		return a.fail(b), !1;
	}
	return a.done(), !0;
}
function N(a = J) {
	let b = A(`concat files`);
	m.map(D.concat, (a, b) => {
		console.log(`concatenating file ${a.name} `),
		m.parallel(a.from.map((a) => (b) => ja(a, b)), (c, d) =>
		c ? (
		console.error(`  error: read source file for concatenating failed!`.red), b(c)) : (
		ka(a.to, d.join('\n')), b()));
	}, (c) => c ? (b.fail(c), a(c)) : (b.done(), a()));
}
function O(a) {return a.endsWith('.pug') || a.endsWith('.jade');}
function P(a) {return { basedir: D.src, filename: j(a) };}
function Q() {o && (
	o.fileLoader = (a) =>
	O(a) ?
	E.pug.enable ?
	p.compileFile(a, P(a))(R) : (
	console.error(`  error: The include file is a pug file. And you had not turn on the pug processor in config file!`.red, '\n',
	`    ${a}`.red), "") :
	!c.existsSync(a) && (
	a.endsWith('.ejs') && (a = a.replace(/\.ejs$/, '.html')),
	!c.existsSync(a)) ? (
	console.error(`  error: The include page is not existed!`.red, '\n',
	`    ${a}`.red), "") :
	c.readFileSync(a, 'utf8'));
}
let R = {};
function S() {
	let a = {},b = A("load ejs variables");
	return D.processor.ejs_variables.files.map((d) => {try {let b = e.safeLoad(c.readFileSync(d, 'utf8'));a = Object.assign(a, b);} catch (a) {return b.fail(a), !1;}}), R = a, !0;
}
function T(a) {
	let b = A('render pages'),
	c = ia(D.src_globs, { cwd: D.src });
	console.log(` pages count: ${c.length}`),
	m.map(c, (a, b) => {
		function c(c, e) {
			if (c) return b({ path: d, err: c });
			if (E.ejs_template_tags.enable && (e = V(e)), E.html_minifier.enable)
				try {e = u.minify(e, E.html_minifier);}
				catch (a) {return b({ path: d, err: a });}
			ka(`${D.dist}/${a}`, e),
			b(null, !0);
		}let d = h(D.src, a);return O(a) && E.pug.enable ? c(null, p.compileFile(d, P(d))(R)) : E.ejs.enable ? o.renderFile(d, R, { root: D.src }, c) : void ja(d, c);
	}, (c) => {
		c ? b.fail(c.err, c.path) : b.done(),
		a && a(c);
	});
}
const U = 'script[type="text/template"]';
function V(a) {
	let b = E.ejs_template_tags.selector || U;
	console.log(`  selector: ${b}`);
	let d = [],
	e = parseInt(1e4 * Math.random() + ''),
	f = `ejstagcache_${e}_`,
	g = `${f}start`,h = `${f}end`,
	j = new RegExp(`${g}(\\d*)${h}`, 'g');
	try {
		let e = t.load(a),
		f = e(b);
		for (var k = 0; k < f.length; k++) {
			let a = f.eq(k),b = c.readFileSync(`${D.src}/${a.attr('src')}`, 'utf8');
			E.html_minifier.enable && (
			b = u.minify(b, E.html_minifier)),
			a.html(b.replace(/<%([\s\S]*?)%>/g, (a) => (
			d.push(a), `${g}${d.length - 1}${h}`))),
			a.removeAttr('src');
		}
		let i = e.html({ decodeEntities: !1 });
		return i.replace(j, (a, b) => d[b]);
	} catch (b) {
		return console.error(`  error: render ejs template tags`.red, '\n', b.stack), a;
	}
}
function W(a) {
	if (I)
	throw `handlerScripts could be only called one time!`;
	I = !0;
	let b = A('handler scripts'),
	{ src: c, dist: d } = D,
	e = ia(D.src_script_globs, { cwd: c });
	m.map(e, (a, b) =>
	X(h(c, a), h(d, ba(a)), b),
	() => (b.done(), a && a()));
}
function X(a, d, e) {
	function f(a, b) {
		if (a) return console.error(`  error: browserify ${h}`.red, "\n", a), l();
		let e = b + '',
		f = null;
		if (k && (f = JSON.parse(y.fromSource(e).toJSON()), e = y.removeMapFileComments(e)), E.babel.enable) {
			let a = Z(Y(), h, e, f);
			if (a.err) return l(a.err);
			e = a.code, f = a.map;
		}
		try {
			ka(d, e),
			k && c.writeFileSync(`${d}.map`, JSON.stringify(f, null, '\t'));
		} catch (a) {
			return console.error(`  error: write codes and sources map to target file failed!`.red, "\n", a.stack || a), l(a);
		}
		return l();
	}let h = j(d),k = E.source_map.enable && E.source_map.js,l = e,m = g([a], { debug: k, basedir: i(d), cache: {}, packageCache: {} });x && (m.plugin(x, E.watchify), m.on('update', () => {l = () => (console.log(`${a} updated!`), H.js()), m.bundle(f);})), m.bundle(f);
}
function Y() {
	let a = E.babel.babelrc;
	if (a && !k(a)) return h(process.cwd(), a);
}
function Z(a, b, c, d = null) {
	try {
		let e = d ? { sourceMaps: !0, inputSourceMap: d } : {};a && (
		e.extends = a);
		let f = q.transform(c, e);
		return {
			code: d ? `${f.code}\n//# sourceMappingURL=${b}.map` : f.code,
			map: f.map };
	} catch (a) {
		return B.e(a, `babel transform ${b}`), { err: a };
	}
}
function $(a) {
	let b = A('handler styles'),
	{ src: c, dist: d } = D,
	e = ia(D.src_styles_globs, { cwd: c });
	m.map(e, (a, b) =>
	_(h(c, a), h(d, ba(a)), b),
	() => (b.done(), a && a()));
}
function _(a, b, d) {
	if (a.endsWith('less')) throw new Error('TODO: support less');return (
		a.endsWith('.sass') || a.endsWith('.scss') ?
		aa(a, b, a.endsWith('.sass'), d) :
		a.endsWith('.css') ?
		c.copy(a, b, (b) => (b && console.error(`  error: copy css file: ${a}`)) + d()) : void (
		console.error(`  warning: unknown style file format: ${a}`),
		d()));
}
function aa(a, b, d, e) {
	let g = j(a),
	h = E.source_map.enable && E.source_map.css,
	i = `${b}.map`;
	r.render({
		file: a,
		indentedSyntax: !1,
		outputStyle: 'compressed',
		outFile: b,
		sourceMap: h ? i : void 0 },
	(a, d) => a ? (
	console.error(`  error: sass compile ${g}`.red, '\n', a), e()) : void
	f(s ? [s] : []).process(d.css, {
		from: g,
		to: j(b),
		map: h ? { inline: !1, prev: JSON.parse(d.map.toString()) } : void 0 }).
	then((a) => {
		let d = a.warnings();
		0 < d.length && (
		console.log(`warn: auto prefixer ${g}`.yellow.bold),
		d.forEach((a) => console.log(`  ${a.toString()}`.yellow))),
		ka(b, a.css),
		h && c.writeFileSync(i, JSON.stringify(a.map, null, '\t')),
		e();
	}).catch((a) => {
		console.error(`  error: auto prefixer ${g}`.red, '\n', a),
		e();
	}));
}
function ba(a = '') {return (
		a.endsWith('.jsx') ? a.replace(/\.jsx$/, '.js') :
		a.replace(/\.s[ca]ss$/, '.css'));
}
function ca() {
	E.browser_sync.enable && (
	F = v.create(),
	F.init(E.browser_sync)),
	w.unwatchTree(D.src),
	w.watchTree(D.src, { interval: 0.5 }, function (a, b, c) {
		if ("object" != typeof a || null !== c || null !== b) {
				let b = a + '';return (
					console.log("watch >".bold, b),
					b.endsWith('.yaml') ? (
					S(), T(H.html)) :
					b.endsWith('.html') || b.endsWith('.ejs') || b.endsWith('.pug') || b.endsWith('.jade') ?
					T(H.html) :
					b.endsWith('.css') || b.endsWith('.sass') ||
					b.endsWith('.scss') || b.endsWith('.less') ?
					$(H.css) : void 0);}
	});
}
function da() {
	let a = process.argv,b = !1;return (
		ga(a, '-h', '--help') ? ea() :
		ga(a, '-V', '--version') ? fa() : (
		ga(a, '-w', '--watch') && (b = !0),
		{ watch: b }));
}
function ea() {
	console.log([
	`Usage: build.js [options] [configName]\n`,
	`Version: ${a}`,
	`Front-end build scripts pack\n`,
	`Options:`,
	`  -V --version  output the version info`,
	`  -h --help     output this help info`,
	`  -w --watch    turn on the watch building mode\n`,
	`ConfigName:`,
	`  [default]     build.config.yaml`,
	`  dev           build.dev.config.yaml`,
	`  prod          build.prod.config.yaml`,
	`  <fileName>    load config from fileName you given`].
	map((a) => '  ' + a).join('\n')),
	process.exit(0);
}
function fa() {
	console.log(a),
	process.exit(0);
}
function ga(a = [], ...b) {
	for (let c of b) if (0 <= a.indexOf(c)) return !0;return !1;
}
function ha(a, b = J) {
	let c = D.hook[a];
	if (!c) return b();
	let { command: d, asynchronous: e } = c,
	f = A(`hook ${a}`);
	l(`${d} "${C}"`, { cwd: __dirname, encoding: 'utf8' },
	(c, d, g) => {d &&
		d.trim().split('\n').map((a) => `hook out: ${a}`).map((a) => console.log(a)), g &&
		g.trim().split('\n').map((a) => `hook err: ${a}`).map((a) => console.error(a)),
		c ? f.fail(c, `executing hook script "${a}" failed!`) : f.done(), e || (
		c ? b(c) : b());
	}), e &&
	b();
}
function ia(a, b) {
	let c = [];
	return a.map((a) => {try {c = c.concat(d.sync(a, b));} catch (a) {console.error(`  error: invalid glob: ${d}`);}}), c;
}
function ja(a, b = null) {return b ? c.readFile(a, 'utf8', b) : c.readFileSync(a, 'utf8');}
function ka(a, b) {
	let d = i(a);
	c.existsSync(d) || c.mkdirsSync(d),
	c.writeFileSync(a, b);
}
K();