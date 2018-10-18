var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var del = require('del');
var runSequence = require('run-sequence');
var watch = require('gulp-watch');
var htmlbeautify = require('gulp-html-beautify');

// SVG sprites
var svgmin = require('gulp-svgmin');
var cheerio = require('gulp-cheerio');
var replace = require('gulp-replace');
var svgSprite = require('gulp-svgsprite');
var rename = require('gulp-rename');

// Images
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

// Css sprites
var spritesmith = require("gulp.spritesmith");

// HTML, CSS, JS
var validator = require('gulp-html');
var usemin = require('gulp-usemin');
var htmlclean = require('gulp-htmlclean');
var uglify = require("gulp-uglify"); // Сжатие JS
var minifyCss = require("gulp-minify-css"); // Сжатие CSS
var rev = require('gulp-rev');

gulp.task('server', function() {
	browserSync.init({
		server: { baseDir: './build/'}
	});

	watch('./src/**/*.html', function(){
		gulp.start('html');
	});

	watch('./src/sass/**/*.sass', function(){
		gulp.start('styles');
	});

	watch('./src/js/**/*.js', function(){
		gulp.start('copy:js');
	});

	watch('./src/libs/**/*.*', function(){
		gulp.start('copy:libs-local');
	});

	watch(['./src/img/**/*.*', '!./src/img/svg-for-sprites/**/*.svg'], function(){
		gulp.start('copy:img');
	});

	watch('./src/img/svg/*.svg', function(){
		gulp.start('svg');
	});
});

gulp.task('server:docs', function() {
	browserSync.init({
		server: { baseDir: './docs/'}
	});
});

gulp.task('styles', function() {
	return gulp.src('./src/sass/**/*.sass')
	.pipe(plumber({
		errorHandler: notify.onError(function(err){
			return {
				title: 'Styles',
				sound: false,
				message: err.message
			}
		})
	}))
	.pipe(sourcemaps.init())
	.pipe(sass())
	.pipe(autoprefixer({
		browsers: ['last 6 versions'],
		cascade: false
	}))
	.pipe(sourcemaps.write())
	.pipe(gulp.dest('./build/css'))
	.pipe(browserSync.stream());
});

gulp.task('html', function() {
	return gulp.src('./src/**/*.html')
	.pipe(htmlbeautify(htmlbeautifyOptions))
	.pipe(gulp.dest('./build/'))
	.pipe(browserSync.stream());
});

var htmlbeautifyOptions = {
	"indent_size": 1,
	"indent_char": "	",
	"eol": "\n",
	"indent_level": 0,
	"indent_with_tabs": true,
	"preserve_newlines": false,
	"max_preserve_newlines": 10,
	"jslint_happy": false,
	"space_after_anon_function": false,
	"brace_style": "collapse",
	"keep_array_indentation": false,
	"keep_function_indentation": false,
	"space_before_conditional": true,
	"break_chained_methods": false,
	"eval_code": false,
	"unescape_strings": false,
	"wrap_line_length": 0,
	"wrap_attributes": "auto",
	"wrap_attributes_indent_size": 4,
	"end_with_newline": false
};

// Сборка спрайтов  PNG
gulp.task('cleansprite', function() {
    return del.sync('src/img/sprite/sprite.png');
});

gulp.task('spritemade', function() {
    var spriteData =
        gulp.src('src/img/png-for-sprite/*.*')
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: '_sprite.sass',
            padding: 20,
            cssFormat: 'sass',
            algorithm: 'binary-tree',
            cssTemplate: 'sass.template.mustache',
            cssVarMap: function(sprite) {
                sprite.name = 's-' + sprite.name;
            }
        }));

    spriteData.img.pipe(gulp.dest('build/img/')); // путь, куда сохраняем картинку
    spriteData.css.pipe(gulp.dest('src/sass')); // путь, куда сохраняем стили
});
gulp.task('sprite', ['cleansprite', 'spritemade']);

gulp.task('svg', function() {
	return gulp.src('./src/img/svg-for-sprites/*.svg')
	.pipe(svgmin({
		js2svg: {
			pretty: true
		}
	}))
	.pipe(cheerio({
		run: function($) {
			$('[fill]').removeAttr('fill');
			$('[stroke]').removeAttr('stroke');
			$('[style]').removeAttr('style');
		},
		parserOptions: { xmlMode: true }
	}))
	.pipe(replace('&gt;', '>'))
	.pipe(svgSprite({
		mode: {
			symbol: {
				sprite: "sprite.svg"
			}
		}
	}))
	.pipe(rename('sprite.svg'))
	.pipe(gulp.dest('./build/img'));
});

gulp.task('copy:libs', function(callback) {
   
  gulp.src('node_modules/jquery/dist/**/*.*')
		.pipe(gulp.dest('./build/libs/jquery'));

	gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
		.pipe(gulp.dest('./build/libs/bootstrap-4/css/'));

	gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
		.pipe(gulp.dest('./build/libs/bootstrap-4/js/'));

	callback()
});

gulp.task('copy:libs-local', function(callback) {
	gulp.src('./build/libs/**/*.*')
		.pipe(gulp.dest('../builds/sync-mac-com/libs/'))
	callback()
});

gulp.task('copy:img', function() {
	return gulp.src(['./src/img/**/*.*', '!./src/img/svg-for-sprites/**/*.svg'])
		.pipe(gulp.dest('./build/img'))
		.pipe(browserSync.stream());
});

gulp.task('copy:js', function() {
	return gulp.src('./src/js/**/*.*')
		.pipe(gulp.dest('./build/js'))
		.pipe(browserSync.stream());
});

gulp.task('copy:libs-build', function() {
	return gulp.src('./src/libs/**/*.*')
		.pipe(gulp.dest('./build/libs/'))
		.pipe(browserSync.stream());
});

gulp.task('clean:build', function() {
    return del('./build/');
});

gulp.task('copy:build:files', function(callback) {
    gulp.src('./src/php/**/*.*')
        .pipe(gulp.dest('./build/php/'))
    gulp.src('./src/files/**/*.*')
        .pipe(gulp.dest('./build/files/'))
	gulp.src('./src/fonts/**/*.*')
	        .pipe(gulp.dest('./build/fonts/'))
	callback()
});

gulp.task('default', function(callback){
    runSequence(
    	'clean:build',
    	['styles', 'html', 'svg', 'copy:libs', 'copy:libs-local', 'copy:img', 'copy:js', 'copy:libs-build', 'copy:build:files', 'sprite'],
    	'server',
		callback
    )
});


/* ------------------------------------
  DOCS TASKS
------------------------------------ */

gulp.task('clean:docs', function() {
    return del('./docs');
});

gulp.task('img:dist', function() {
    return gulp.src('./build/img/**/*.*')
	.pipe(imagemin({
		progressive: true,
		// optimizationLevel: 5,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()],
		interlaced: true
	}))
    .pipe(gulp.dest('./docs/img'));
});

gulp.task('img:builds', function() {
    return gulp.src('./build/img/**/*.*')
	.pipe(imagemin({
		progressive: true,
		// optimizationLevel: 5,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()],
		interlaced: true
	}))
    .pipe(gulp.dest('../builds/sync-mac-com/img'));
});

gulp.task('copy:docs:files', function(callback) {
    gulp.src('./src/php/**/*.*')
        .pipe(gulp.dest('./dist/php/'))
    gulp.src('./src/files/**/*.*')
        .pipe(gulp.dest('./dist/files/'))
	gulp.src('./src/fonts/**/*.*')
	        .pipe(gulp.dest('./docs/fonts/'))
	callback()
});

gulp.task('html:docs', function() {
    return gulp.src('./build/**/*.html')
    	.pipe(usemin({
    		//  <!-- build:cssVendor css/vendor.css --> <!-- endbuild -->
			cssVendor: [function() { return rev() }, function() { return minifyCss() } ], 
			// cssCustom: [function() { return rev() }, function() { return minifyCss() } ],
			jsLibs: [function() { return rev() }, function() { return uglify() } ],
			jsVendor: [function() { return rev() }, function() { return uglify() } ],
			// jsMain: [function() { return rev() }, function() { return uglify() } ]
    	}))
		.pipe(htmlclean())
	.pipe(gulp.dest('./docs/'));
});

gulp.task('docs', function(callback){
    runSequence(
		'clean:build',
    	['styles', 'html', 'svg', 'copy:libs', 'copy:libs-local', 'copy:img', 'copy:js'],
    	'clean:docs',
    	['img:dist', 'copy:docs:files', 'html:docs' ],
    	'server:docs',
		callback
    )
});

/* ------------------------------------
  Create folder builds for production
------------------------------------ */

gulp.task('copy-builds:js', function() {
	return gulp.src('./src/js/**/*.*')
		.pipe(gulp.dest('../builds/xtorrent/js'))
		.pipe(browserSync.stream());
});

gulp.task('copy-builds:css', function() {
	return gulp.src('./build/css/**/*.*')
		.pipe(gulp.dest('../builds/xtorrent/css'))
		.pipe(browserSync.stream());
});

gulp.task('img:builds', function() {
    return gulp.src('./src/img/**/*.*')
	.pipe(imagemin({
		progressive: true,
		// optimizationLevel: 5,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()],
		interlaced: true
	}))
	.pipe(gulp.dest('../builds/xtorrent/img/'));
});

gulp.task('copy:builds:files', function(callback) {
    gulp.src('./src/php/**/*.*')
        .pipe(gulp.dest('../builds/xtorrent/php/'))
    gulp.src('./src/files/**/*.*')
        .pipe(gulp.dest('../builds/xtorrent/files/'))
	gulp.src('./src/fonts/**/*.*')
	        .pipe(gulp.dest('../builds/xtorrent/fonts/'))
	callback()
});

gulp.task('html:builds', function() {
    return gulp.src('./build/**/*.html')
    .pipe(usemin({
    		//  <!-- build:cssVendor css/vendor.css --> <!-- endbuild -->
			// cssVendor: [function() { return rev() }, function() { return minifyCss() } ], 
			// cssCustom: [function() { return rev() }, function() { return minifyCss() } ],
			// jsLibs: [function() { return rev() }, function() { return uglify() } ],
			// jsVendor: [function() { return rev() }, function() { return uglify() } ],
			// jsMain: [function() { return rev() }, function() { return uglify() } ]
    	}))
		.pipe(htmlclean())
	.pipe(gulp.dest('../builds/xtorrent/'));
});

gulp.task('builds', function(callback){
    runSequence(
  	['styles', 'html', 'svg', 'copy:libs', 'copy:libs-local', 'copy:img', 'copy:js', 'copy:libs-build'],
  	['copy-builds:css', 'copy-builds:js','img:builds', 'copy:builds:files', 'html:builds'],
		callback
    )
});