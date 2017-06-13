var gulp = require('gulp');
var initGulpTasks = require('react-component-gulp-tasks');

/**
 * Tasks are added by the react-component-gulp-tasks package
 */

var taskConfig = {

  component: {
    name: 'HotMic',
    dependencies: [
      'classnames',
      'react',
      'react-dom'
    ],
    lib: 'lib'
  },

  example: {
    src: 'example/src',
    dist: 'example/dist',
    files: [
      'index.html',
      '.gitignore'
    ],
    scripts: [
      'example.js'
    ],
    sass: [
      'example.scss'
    ]
  }

};

initGulpTasks(gulp, taskConfig);
