type ConfigObject = {
	name: string;
	dist: string;
	clean_dist: boolean;

	src: string;
	src_assets: FromToObject[];
	
	src_globs: string[];
	src_script_globs: string[];
	src_styles_globs: string[];
	
	watch: string[]|false;

	processor: ProcessorConfigObject;
};
type FromToObject = {
	name: string;
	from: string;
	to: string;
};
type ProcessorConfigObject = {
	sass: BaseConfigProcessorObject;
	less: BaseConfigProcessorObject;
	autoprefixer: BaseConfigProcessorObject;
	ejs: BaseConfigProcessorObject;
	babel: BaseConfigProcessorObject & BabelProcessorExtend;
	html_minifier: BaseConfigProcessorObject & HtmlMinifierProcessorExtend;
	ejs_variables: BaseConfigProcessorObject & EjsVariablesProcessorExtend;
	ejs_template_tags: BaseConfigProcessorObject & EjsTemplateTagsProcessorExtend;
}

type BaseConfigProcessorObject = {
	enable: boolean;
};
type HtmlMinifierProcessorExtend = {
	removeComments: boolean,
	collapseWhitespace: boolean
};
type BabelProcessorExtend = {
	babelrc: string;
};
type EjsTemplateTagsProcessorExtend = {
	selector: string;
};
type EjsVariablesProcessorExtend = {
	files: string[];
};