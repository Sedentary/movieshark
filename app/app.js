'use strict';

// Declare app level module which depends on views, and components
angular.module('movieshark', [
  'ngRoute',
  'movieshark.dashboard',
  'movieshark.version'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/dashboard'});
}]);