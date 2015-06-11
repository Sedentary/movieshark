module.exports = function(config){
  config.set({

    basePath : './',

    files : [
      'app/front/bower_components/angular/angular.js',
      'app/front/bower_components/angular-route/angular-route.js',
      'app/front/bower_components/angular-mocks/angular-mocks.js',
      'app/front/components/**/*.js',
      'app/view*/**/*.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
