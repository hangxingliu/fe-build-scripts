type ReloadObject = { html?: ReloadFunc; js?: ReloadFunc; css?: ReloadFunc;};
type ReloadFunc = () => void;

type ConfigObject = {
	name: string;
	dist: string;
	clean_dist: boolean;

	src: string;
	src_assets: FromToObject[];
	concat: ConcatenateObject[];
	hook: HookScriptMap;
	
	src_globs: string[];
	src_script_globs: string[];
	src_styles_globs: string[];
	
	watch: string[]|false;

	processor: ProcessorsConfig;
};
type FromToObject = {
	name: string;
	from: string;
	to: string;
};
type ConcatenateObject = {
	name: string;
	to: string;
	from: string[];
};
type HookScriptMap = { [hookName: string]: HookScriptObject; };
type HookScriptObject = {
	command: string;
	asynchronous: boolean;
};

type ProcessorsConfig = {
	source_map: ProcessorConfig & SourceMapExtend;
	watchify: ProcessorConfig & WatchifyProcessorExtend;
	browserify: ProcessorConfig & BrowserifyExtend;
	sass: ProcessorConfig;
	less: ProcessorConfig;
	ejs: ProcessorConfig;
	pug: ProcessorConfig;
	autoprefixer: ProcessorConfig;
	browser_sync: ProcessorConfig;
	babel: ProcessorConfig & BabelProcessorExtend;
	html_minifier: ProcessorConfig & HtmlMinifierProcessorExtend;
	ejs_variables: ProcessorConfig & EjsVariablesProcessorExtend;
	ejs_template_tags: ProcessorConfig & EjsTemplateTagsProcessorExtend;
}

type ProcessorConfig = { enable: boolean };

type BrowserifyExtend = { transform: BrowserifyTransformObject[] };
type BrowserifyTransformObject = { name: string, options?: any };
type SourceMapExtend = { js: boolean; css: boolean; };

type WatchifyProcessorExtend = {
	delay: number;
	ignoreWatch: string[];
	poll: boolean;
};
type HtmlMinifierProcessorExtend = {
	removeComments: boolean,
	collapseWhitespace: boolean
};
type BabelProcessorExtend = { babelrc: string };
type EjsTemplateTagsProcessorExtend = { selector: string };
type EjsVariablesProcessorExtend = { files: string[] };
