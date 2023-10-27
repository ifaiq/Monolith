var gulp = require('gulp');
var gzip = require('gulp-gzip');
var replace = require('gulp-replace');

gulp.task('preloadstyles', function() {
    return gulp.src('./dist/**/index.html')
    .pipe(replace(/rel="stylesheet"/g, function(s, filename) {
        return 'name="preload-style" rel="preload" as="style"';
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('asyncJC', function() {
    return gulp.src('./dist/**/index.html')
    .pipe(replace(/type="text\/javascript" src=/g, function(s, filename) {
        return 'defer type="text/javascript" src=';
    }))
    .pipe(gulp.dest('./dist'));
});


gulp.task('compress', function() {
  return gulp.src(['./dist/**/*.*'])
      .pipe(gzip())
      .pipe(gulp.dest('./dist'));
});


gulp.task('combineIndexFile',gulp.series('preloadstyles', 'asyncJC'));


gulp.task('gulpTasks', gulp.series('combineIndexFile','compress'));