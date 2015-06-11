'use strict';

angular.module('movieshark.dashboard', ['ngRoute', 'infinite-scroll'])

.config(['$routeProvider', function ($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'DashboardCtrl'
  });
}])

.controller('DashboardCtrl', ['$scope', '$http', function ($scope, $http) {
  $scope.movies = [];
  $scope.currentOffset = 1;

  $scope.nextOffset = function () {
    $http.get('http://eztvapi.re/shows/' + $scope.currentOffset)
        .success(updateMovies);
  };

  var updateMovies = function (newMovies) {
    $scope.movies.concat(newMovies);
    $scope.currentOffset++;
  };
}]);