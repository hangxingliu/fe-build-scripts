# Frontend build scripts 

**This project is experimental now. It is divided from my other project**  

## How to use

### NPM way(TODO)

1. `npm i fe-build-scripts -g`
2. execute `fe-build-scripts install` in your project folder
3. config `build/build.config.yaml`
4. execute `./build/build.js` or `./build/build.js -w`

### Git way

1. clone
2. copy `build` to project root folder
3. config `build/build.config.yaml`
4. execute `./build/build.js` or `./build/build.js -w`

## What scripts do

### Pages

- HTML/Ejs/Pug  == Inject variables(optional) ==> Inject template(optional) ==> Target HTML

### Scripts

- Javascript/JSX  == Browserify ==> Babel(optional) ==> Target Javascript

### StyleSheets

- Css/Sass/Less == Compile ==> AutoPrefixer(Optional) ==> Target Css

### Assets/Libraries

- Files == Copy ==> Target Files   
- Files == Concat ==> Target Files

### Live Building/Watching 

- Javascript/JSX == Watchify ==> Rebuild ==> Target Javascript
- Files == Module: Watch ==> Rebuild ==> Target Files 
- After rebuild == BrowserSync(Optional) ==> Reload Browser

### Automatically Rename

- `jsx` => `js`
- `sass`/`scss` => `css`

## Tips

### React JSX Project

Add followed codes into your `package.json`

``` js
{
	// ...
	"browserify": {
		"transform": [ 
			[ "babelify", { "presets": [ "react" ] } ]
		]
	}
	// ...
}
```

## TODO

[TODO.md]()

## LICENSE

[Apache-2.0](LICENSE)

## Author

[LiuYue](https://github.com/hangxingliu)