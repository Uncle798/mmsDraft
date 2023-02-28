/* eslint-disable no-plusplus */
/* eslint-disable no-console */
const gulp = require('gulp');
const debug = require('debug')('gulpfile');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();
const ngrok = require('ngrok');
const dotenv = require('dotenv');
const fs = require('fs');

const browserSyncPort = 3002;

async function startHttpS() {
  try {
    const result = await dotenv.config();
    if (result.error) { debug(result.error); }
    const server = await nodemon({
      script: './bin/https', // this is where my express server is
      ext: 'js handlebars', // nodemon watches *.js, *.handlebars and *.css files
      env: { NODE_ENV: 'development' },
    });
    debug(`Server listing on ${server}`);
  } catch (error) {
    console.error(error);
    debug(error);
  }
}

async function startHttp() {
  try {
    const result = await dotenv.config();
    if (result.error) { debug(result.error); }
    const server = await nodemon({
      script: './bin/www', // this is where my express server is
      ext: 'js pug css', // nodemon watches *.js, *.handlebars and *.css files
      env: { NODE_ENV: 'development' },
    });
    debug(`Server listing on ${server}`);
  } catch (error) {
    console.error(error);
    debug(error);
  }
}

async function startReload() {
  browserSync.init({
    port: browserSyncPort, // this can be any port, it will show our app
    proxy: 'http://localhost:3000/', // this is the port where express server works
    ui: { port: 3003 }, // UI, can be any port
    reloadDelay: 2500, // Important, otherwise syncing will not work
  });
  gulp.watch(['./**/*.js', './**/*.pug', './**/*.css']).on('change', browserSync.reload);
}

async function startNgrok() {
  const result = dotenv.config();
  const keys = Object.keys(result.parsed);
  const values = Object.values(result.parsed);
  const url = await ngrok.connect(browserSyncPort);
  await fs.writeFile('./.env', '', (err) => { debug(err); });
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === 'NGROK_URL') {
      // eslint-disable-next-line no-continue
      continue;
    } else {
      fs.appendFileSync('./.env', `${keys[i]}="${values[i]}"\r\n`);
    }
  }
  fs.appendFileSync('./.env', `NGROK_URL="${url}"\r\n`);
  dotenv.config();
  debug(`ngrok public url: ${url}`);
}

exports.startDev = gulp.series([startNgrok, startHttp, startReload]);
exports.startHttps = gulp.series([startNgrok, startHttpS, startReload]);
exports.startNgrok = startNgrok;
exports.startHttp = startHttp;
exports.startReload = startReload;
exports.startHttpS = startHttpS;
