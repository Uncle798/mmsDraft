const gulp = require('gulp');
const debug = require('debug')('gulpfile');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();
const needle = require('needle');
const ngrok = require('ngrok');
const dotenv = require('dotenv');
const fs = require('fs');

const browserSyncPort = 3002;

async function startServer() {
  try {
    const result = await dotenv.config();
    if (result.error) { debug(result.error); }
    console.log(`>result.parsed = ${result.parsed}`);
    for (let i = 0; i < (Object.keys(result.parsed)).length; i++) {
      debug(`> result ${Object.keys(Object.values(result.parsed))}`);
    }
    nodemon({
      script: './bin/www', // this is where my express server is
      ext: 'js handlebars css', // nodemon watches *.js, *.handlebars and *.css files
      env: { NODE_ENV: 'development' },
    });
  } catch (error) {
    console.log(error)
    debug(error);
  }
}

async function startReload() {
  browserSync.init({
    port: browserSyncPort, // this can be any port, it will show our app
    proxy: 'http://localhost:3000/', // this is the port where express server works
    ui: { port: 3003 }, // UI, can be any port
    reloadDelay: 2000, // Important, otherwise syncing will not work
  });
  gulp.watch(['./**/*.js', './**/*.handlebars', './**/*.css']).on('change', browserSync.reload);
}

async function startNgrok() {
  let result = dotenv.config();
  debug(`> result ${result}`);
  const url = await ngrok.connect(browserSyncPort);
  const parsedEnv = dotenv.parse();
  parsedEnv.NRGOK_URL = url;
  await fs.writeFile('./.env', parsedEnv, (err) => { debug(err); });
  result = dotenv.config();
  debug(`> result ${result}`);
}

exports.startDev = gulp.series([startServer, startReload]);
exports.startNgrok = startNgrok;
exports.startServer = startServer;
exports.startReload = startReload;
