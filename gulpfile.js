const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();

gulp.task('gulp_nodemon', () => {
});

async function startServer() {
  try {
    nodemon({
      script: './bin/www', // this is where my express server is
      ext: 'js handlebars css', // nodemon watches *.js, *.handlebars and *.css files
      env: { NODE_ENV: 'development' },
    });
  } catch (error) {
    console.log(error);
  }
}

function startReload() {
  setTimeout(() => {
    
  }, timeout);
  browserSync.init({
    port: 3002, // this can be any port, it will show our app
    proxy: 'http://localhost:3000/', // this is the port where express server works
    ui: { port: 3003 }, // UI, can be any port
    reloadDelay: 2000, // Important, otherwise syncing will not work
  });
}

gulp.task('sync', () => {
  gulp.watch(['./**/*.js', './**/*.handlebars', './**/*.css']).on('change', browserSync.reload);
});

exports.default = gulp.series([startServer, startReload]);
