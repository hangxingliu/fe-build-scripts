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

HTML => EJS/PUG => HTML  
JS, JS, .... => Browserify => Babel => JS  
CSS/LESS/SASS => Processor => CSS  
Assets => Copy => Assets  

## TODO

[TODO.md]()

## LICENSE

[Apache-2.0](LICENSE)

## Author

[LiuYue](https://github.com/hangxingliu)