#!/usr/bin/env node
/**
 * @license Apache-2.0
 * 
 * frontend build scripts
 * version: 1.0.0-alpha
 * date: 2017-08-21 07:07
 */
const a = '1.0.0-alpha',
b = `${__dirname}/build.config.yaml`;
require('colors');
let c = require('fs-extra'),
d = require('js-yaml'),
e = require('postcss'),
f = require('browserify'),
{ join: g, dirname: h, basename: i, isAbsolute: j } = require('path'),
{ exec: k } = require('child_process'),
l = require('async'),
{ read: m } = require('./config_reader'),
{
	globFiles: n,
	readFile: o,
	writeFileWithMkdirsSync: p,
	error: q, exit: r, getHelp: s, startTask: t,
	isPugFile: u,
	loadYAMLFiles: v,
	EMPTY_CALLBACK: w } =
require('./build_utils'),
x = null,
y = null,
z = null,
A = null,
B = null,
C = null,
D = null,
E = null,
F = null,
G = null,
H = null;
function I(a) {
	let b = M;
	b.source_map.enable && b.source_map.js && (H = require('convert-source-map')),
	b.sass.enable && (A = require('node-sass')),
	b.less.enable && console.log('LESS is TODO...'),
	b.autoprefixer.enable && (B = require('autoprefixer')),
	b.babel.enable && (z = require('babel-core')),
	b.html_minifier.enable && (D = require('html-minifier')),
	b.ejs.enable && (x = require('ejs')),
	b.ejs_template_tags.enable && (C = require('cheerio')),
	b.pug.enable && (y = require('pug')),
	a.watch && (
	F = require('watch'),
	G = require('watchify'),
	b.browser_sync.enable && (E = require('browser-sync')));
}
let J = 0,
K = !1,
L = null,
M = null,
N = null,
O = {},
P = {},
Q = (a) => {J++, N && N.reload(a);};
['html', 'css', 'js'].map((a) => P[a] = () => Q(`*.${a}`));
function R() {
	let a = ja();
	K = a.watch,
	L = m(b),
	M = L.processor,
	I(a),
	ka('before_all', (b) => {
		if (b) return r(11);
		L.clean_dist && (S() || r(1)),
		T() || r(2),
		L.concat && L.concat.length && U((a) => a && r(3)), (
		M.ejs.enable || M.ejs_template_tags.enable) && (
		x.fileLoader = X),
		M.ejs_variables.enable && (W() || r(4));
		let c = t('first build');
		l.parallel([Y, aa, ea],
		(a) => a ?
		c.fail(a) : void (
		J++,
		ka('after_build', (a) => a ? r(10) : c.done()))),
		a.watch ? (console.log("# Watch mode is on".bold), ia()) :
		console.log("  Tip: -w option could turn on the watch mode".grey);
	});
}
function S() {
	let a = t('clean target folder');
	try {c.removeSync(L.dist);} catch (b) {return a.fail(b), !1;}
	return a.done(), !0;
}
function T() {
	let a = t(`copy asset files`);
	console.log(`asset folders: ${L.src_assets.map((a) => a.name).join(', ')}`);
	try {
		L.src_assets.map((a) => c.copySync(a.from, a.to));
	} catch (b) {
		return a.fail(b), !1;
	}
	return a.done(), !0;
}
function U(a = w) {
	let b = t(`concat files`);
	l.map(L.concat, (a, b) => {
		console.log(`concatenating file ${a.name} `),
		l.parallel(a.from.map((a) => (b) => o(a, b)), (c, d) =>
		c ? (
		q(`read source file for concatenating failed!`), b(c)) : (
		p(a.to, d.join('\n')), b()));
	}, (c) => c ? (b.fail(c), a(c)) : (b.done(), a()));
}
function V(a) {return { basedir: L.src, filename: i(a) };}
function W() {
	let a = t("load ejs variables");return (
		O = v(L.processor.ejs_variables.files), O ? (
		a.done(), !0) : (a.fail(`load ejs variable failed (invalid yaml)`), !1));
}
function X(a) {return (
		u(a) ?
		M.pug.enable ?
		y.compileFile(a, V(a))(O) : (
		q(`You had not turn on the pug processor in config file!`), "") :
		!c.existsSync(a) && (
		a.endsWith('.ejs') && (a = a.replace(/\.ejs$/, '.html')),
		!c.existsSync(a)) ? (
		q(`The include page is not existed! (${a})`), "") :
		o(a));
}
function Y(a) {
	let b = t('render pages'),
	c = n(L.src_globs, { cwd: L.src });
	console.log(` pages count: ${c.length}`),
	l.map(c, (a, b) => {
		function c(c, e) {
			if (c) return b({ path: d, err: c });
			if (M.ejs_template_tags.enable && (e = $(e)), M.html_minifier.enable)
				try {e = D.minify(e, M.html_minifier);}
				catch (a) {return b({ path: d, err: a });}
			p(`${L.dist}/${a}`, e),
			b(null, !0);
		}let d = g(L.src, a);return u(a) && M.pug.enable ? c(null, y.compileFile(d, V(d))(O)) : M.ejs.enable ? x.renderFile(d, O, { root: L.src }, c) : void o(d, c);
	}, (c) => {
		c ? b.fail(c.err, c.path) : b.done(),
		a && a(c);
	});
}
const Z = 'script[type="text/template"]';
function $(a) {
	let b = M.ejs_template_tags.selector || Z;
	console.log(`  selector: ${b}`);
	let d = [],
	e = parseInt(1e4 * Math.random() + ''),
	f = `ejstagcache_${e}_`,
	g = `${f}start`,h = `${f}end`,
	j = new RegExp(`${g}(\\d*)${h}`, 'g');
	try {
		let e = C.load(a),
		f = e(b);
		for (var k = 0; k < f.length; k++) {
			let a = f.eq(k),b = c.readFileSync(`${L.src}/${a.attr('src')}`, 'utf8');
			M.html_minifier.enable && (
			b = D.minify(b, M.html_minifier)),
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
let _ = !1;
function aa(a) {
	if (_)
	throw `buildScripts could be only called one time!`;
	_ = !0;
	let b = t('handler scripts'),
	{ src: c, dist: d } = L,
	e = n(L.src_script_globs, { cwd: c });
	l.map(e, (a, b) =>
	ba(g(c, a), g(d, ha(a)), b),
	() => (b.done(), a && a()));
}
function ba(a, d, e) {
	function g(a, b) {
		if (a) return console.error(`  error: browserify ${j}`.red, "\n", a), l();
		let e = b + '',
		f = null;
		if (k && (f = JSON.parse(H.fromSource(e).toJSON()), e = H.removeMapFileComments(e)), M.babel.enable) {
			let a = da(ca(), j, e, f);
			if (a.err) return l(a.err);
			e = a.code, f = a.map;
		}
		try {
			p(d, e),
			k && c.writeFileSync(`${d}.map`, JSON.stringify(f, null, '\t'));
		} catch (a) {
			return console.error(`  error: write codes and sources map to target file failed!`.red, "\n", a.stack || a), l(a);
		}
		return l();
	}let j = i(d),k = M.source_map.enable && M.source_map.js,l = e,m = f([a], { debug: k, basedir: h(d), cache: {}, packageCache: {} });M.browserify.transform.map(({ name: a, options: b }) => m.transform(a, b)), K && (m.plugin(G, M.watchify), m.on('update', () => {l = () => (console.log(`${a} updated!`), P.js()), m.bundle(g);})), m.bundle(g);
}
function ca() {
	let a = M.babel.babelrc;
	if (a && !j(a)) return g(process.cwd(), a);
}
function da(a, b, c, d = null) {
	try {
		let e = d ? { sourceMaps: !0, inputSourceMap: d } : {};a && (
		e.extends = a);
		let f = z.transform(c, e);
		return {
			code: d ? `${f.code}\n//# sourceMappingURL=${b}.map` : f.code,
			map: f.map };
	} catch (a) {
		return q(`babel transform ${b}`, a), { err: a };
	}
}
function ea(a) {
	let b = t('handler styles'),
	{ src: c, dist: d } = L,
	e = n(L.src_styles_globs, { cwd: c });
	l.map(e, (a, b) =>
	fa(g(c, a), g(d, ha(a)), b),
	() => (b.done(), a && a()));
}
function fa(a, b, d) {
	if (a.endsWith('less')) throw new Error('TODO: support less');return (
		a.endsWith('.sass') || a.endsWith('.scss') ?
		ga(a, b, a.endsWith('.sass'), d) :
		a.endsWith('.css') ?
		c.copy(a, b, (b) => (b && console.error(`  error: copy css file: ${a}`)) + d()) : void (
		console.error(`  warning: unknown style file format: ${a}`),
		d()));
}
function ga(a, b, d, f) {
	let g = i(a),
	h = M.source_map.enable && M.source_map.css,
	j = `${b}.map`;
	A.render({
		file: a,
		indentedSyntax: !1,
		outputStyle: 'compressed',
		outFile: b,
		sourceMap: h ? j : void 0 },
	(a, d) => a ? (
	console.error(`  error: sass compile ${g}`.red, '\n', a), f()) : void
	e(B ? [B] : []).process(d.css, {
		from: g,
		to: i(b),
		map: h ? { inline: !1, prev: JSON.parse(d.map.toString()) } : void 0 }).
	then((a) => {
		let d = a.warnings();
		0 < d.length && (
		console.log(`warn: auto prefixer ${g}`.yellow.bold),
		d.forEach((a) => console.log(`  ${a.toString()}`.yellow))),
		p(b, a.css),
		h && c.writeFileSync(j, JSON.stringify(a.map, null, '\t')),
		f();
	}).catch((a) => {
		q(`auto prefixer ${g}`, a),
		f();
	}));
}
function ha(a = '') {return (
		a.endsWith('.jsx') ? a.replace(/\.jsx$/, '.js') :
		a.replace(/\.s[ca]ss$/, '.css'));
}
function ia() {
	M.browser_sync.enable && (
	N = E.create(),
	N.init(M.browser_sync)),
	F.unwatchTree(L.src),
	F.watchTree(L.src, { interval: 0.5 }, function (a, b, c) {
		if ("object" != typeof a || null !== c || null !== b) {
				let b = a + '';return (
					console.log("watch >".bold, b),
					b.endsWith('.yaml') ? (
					W(), Y(P.html)) :
					b.endsWith('.html') || b.endsWith('.ejs') || u(b) ?
					Y(P.html) :
					b.endsWith('.css') || b.endsWith('.sass') ||
					b.endsWith('.scss') || b.endsWith('.less') ?
					ea(P.css) : void 0);}
	});
}
function ja() {
	function b(...a) {
		for (let b of a) if (0 <= process.argv.indexOf(b)) return !0;return !1;
	}let c = !1;return b('-h', '--help') && r(0, s()), b('-V', '--version') && r(0, a), b('-w', '--watch') && (c = !0), { watch: c };
}
function ka(a, b = w) {
	let c = L.hook[a];
	if (!c) return b();
	let { command: d, asynchronous: e } = c,
	f = t(`hook ${a}`);
	k(`${d} "${J}"`, { cwd: __dirname, encoding: 'utf8' },
	(c, d, g) => {d &&
		d.trim().split('\n').map((a) => `hook out: ${a}`).map((a) => console.log(a)), g &&
		g.trim().split('\n').map((a) => `hook err: ${a}`).map((a) => console.error(a)),
		c ? f.fail(c, `executing hook script "${a}" failed!`) : f.done(), e || (
		c ? b(c) : b());
	}), e &&
	b();
}
R();