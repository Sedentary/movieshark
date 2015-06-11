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

  $http.get('http://localhost:3000/shows/' + $scope.currentOffset)
        .success(function (newMovies) {
        $scope.movies = newMovies;
        $scope.currentOffset++;
      });
}]);