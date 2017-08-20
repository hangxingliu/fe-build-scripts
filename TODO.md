# TODO

- [x] fix bug: the enable of babel is invalid
- [x] fix bug: html minify error make build script crash
- [x] fix bug: sass file with .sass extension name will cause source-map file name wrong

- [x] support hook scripts
	- [x] before all
	- [x] after build
	- [x] async/sync
- [x] support HTML compression
- [x] support pug/jade
- [x] support enable or disable source-map
- [x] support browserSync
- [x] support multi-config for building scripts
- [x] support files concat (purely concatenate for libraries)
	- [ ] support sources map for concatenated d file
- [x] support extension name map (now support: .jsx => .js .sass/.scss => .css)
	- [ ] support custom extension name map
- [x] support add browserify transform
	- [ ] support add browserify plugins
- [ ] support less
- [ ] support CSS compression
- [ ] support install build script into project automatically 
- [ ] support analyze build scripts dependencies from config and babelrc
- [ ] support pass source file system structure into ejs/pug variables
- [ ] support parallel building
	- [ ] average each scripts building to independent process to improve speed
- [ ] support dividing config to sub-config files (`extend`/`include`)
- [ ] support download network file into dist folder
