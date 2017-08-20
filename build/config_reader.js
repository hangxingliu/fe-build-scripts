#!/usr/bin/env node
/**
 * @license Apache-2.0
 * 
 * frontend build scripts
 * version: 0.6.2
 * date: 2017-08-21 02:53
 */
const a = '0.6.2';
(function () {
	function a(a) {return !a && 'object' == typeof a;}
	function b(a) {return a && 'object' == typeof a;}
	function c(a) {return 'string' == typeof a;}
	function d(a) {return 'boolean' == typeof a;}
	function e(a) {
		if (!Array.isArray(a)) return !1;
		for (let b of a) if ('string' != typeof b) return !1;
		return !0;
	}
	function f(a) {return c(a) || e(a);}
	function g(a, b) {
		return new Error(`Config is incomplete. "${a}" is not a ${b}!`);
	}
	function h(a) {return b(a) && d(a.enable);}const i = { WATCHIFY: { delay: 100, ignoreWatch: ['**/node_modules/**'], poll: !1 } },j = ['before_all', 'after_build'],k = 'async_',l = j.map((a) => k + a),m = [].concat(l, j);let n = require('js-yaml'),{ readFileSync: o } = require('fs-extra'),{ join: p } = require('path');
	module.exports = { read: function (j) {let l = o(j, 'utf8'),q = n.safeLoad(l);if (!c(q.name)) throw g(`config.name`, 'String');if (!b(q.src)) throw g(`config.src`, 'Object');if (!c(q.src.base)) throw g(`config.src.base`, 'String');if (a(q.src.scripts) && (q.src.scripts = []), a(q.src.styles) && (q.src.styles = []), !f(q.src.scripts)) throw g(`config.src.scripts`, 'String/String[]');if (!f(q.src.styles)) throw g(`config.src.styles`, 'String/String[]');if (b(q.src.concat) && Object.keys(q.src.concat).map((a) => {if (!e(q.src.concat[a])) throw g(`config.src.concat["${a}"]`, 'string[]');}), b(q.hook) && Object.keys(q.hook).map((a) => {if (0 > m.indexOf(a)) throw g(`config.hook["${a}"]`, `valid hook event name`);if (!c(q.hook[a])) throw g(`config.hook["${a}"]`, `string`);}), a(q.src.assets) && (q.src.assets = []), a(q.src.pages) && (q.src.pages = []), !f(q.src.assets)) throw g(`config.src.assets`, 'String/String[]');if (!f(q.src.pages)) throw g(`config.src.pages`, 'String/String[]');if (!b(q.dist)) throw g(`config.dist`, 'Object');if (!c(q.dist.base)) throw g(`config.dist.base`, 'String');if (!d(q.dist.clean)) throw g(`config.dist.clean`, 'Boolean');let r = process.cwd(),s = p(r, q.dist.base),t = p(r, q.src.base),u = {};u.name = q.name, u.src = t, u.dist = s, u.clean_dist = !!q.dist.clean;let v = q.src.assets;u.src_assets = (c(v) ? [v] : v).map((a) => ({ name: a, from: p(t, a), to: p(s, a) }));let w = q.src.pages;u.src_globs = c(w) ? [w] : w;let x = q.src.scripts;u.src_script_globs = c(x) ? [x] : x;let y = q.src.styles;u.src_styles_globs = c(y) ? [y] : y;let z = q.src.concat || {};u.concat = Object.keys(z).map((a) => ({ name: a, to: p(s, a), from: z[a].map((a) => p(t, a)) }));let A = q.hook || {},B = {};Object.keys(A).map((a) => {B[a.replace(k, '')] = { command: A[a], asynchronous: a.startsWith(k) };}), u.hook = B;let C = {},D = q.processor || {};if (C.sass = { enable: !!D.sass }, C.less = { enable: !!D.less }, C.autoprefixer = { enable: !!D.autoprefixer }, C.ejs = { enable: !!D.ejs }, C.pug = { enable: !!D.pug }, C.watchify = Object.assign({}, i.WATCHIFY, D.watchify || {}), !1 === C.watchify.enable) throw g(`processor.watchify.enable`, 'true/undefined');return delete C.watchify.enable, C.source_map = h(D.source_map) ? D.source_map : { enable: !!D.source_map }, C.html_minifier = h(D.html_minifier) ? D.html_minifier : { enable: !!D.html_minifier }, C.browser_sync = h(D.browser_sync) ? D.browser_sync : { enable: !!D.browser_sync }, C.babel = h(D.babel) ? D.babel : { enable: !!D.babel }, C.ejs_variables = h(D.ejs_variables) ? D.ejs_variables : { enable: !!D.ejs_variables }, C.ejs_template_tags = h(D.ejs_template_tags) ? D.ejs_template_tags : { enable: !!D.ejs_template_tags }, u.processor = C, u;} };
})();